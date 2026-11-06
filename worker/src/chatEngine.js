/**
 * Diversity Collective Ventura County — Ask DCVC Chat Execution Engine
 * 
 * Powered by Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct-fp8)
 * Budget: $0 recurring cost
 * 
 * Enforces:
 *  - Rate Limiting (10 req/min per IP)
 *  - Usage-conscious token limits (max_tokens: 384)
 *  - Strict zero-hallucination grounding
 *  - Fallback message when unverified
 *  - Emergency crisis handling (988, Trevor Project)
 *  - Medical / legal boundary disclaimers
 *  - Quota-exceeded graceful degradation
 */

import { 
  searchKnowledgeBase, 
  buildRetrievedContext, 
  buildChatbotSystemPrompt, 
  EXACT_FALLBACK_MESSAGE, 
  DCVC_CONTACT_URL 
} from './knowledgeBase.js';

// In-memory IP rate limiter for Cloudflare Worker runtime
// Maps client IP to array of timestamps in past 60 seconds
const rateLimitMap = new Map();

/**
 * Check if client IP has exceeded sliding rate limit (10 queries/min)
 */
export function checkRateLimit(clientIp, limit = 10, windowMs = 60000) {
  if (!clientIp) return { allowed: true, remaining: limit };

  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIp) || [];
  
  // Filter timestamps within the current window
  const recent = timestamps.filter(ts => now - ts < windowMs);
  
  if (recent.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((recent[0] + windowMs - now) / 1000)
    };
  }

  recent.push(now);
  rateLimitMap.set(clientIp, recent);

  // Evict old entries periodically
  if (rateLimitMap.size > 2000) {
    for (const [ip, tsList] of rateLimitMap.entries()) {
      if (tsList.every(t => now - t >= windowMs)) {
        rateLimitMap.delete(ip);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - recent.length
  };
}

/**
 * Handle boundary queries (Crisis, Medical, Legal, Prompt Injection)
 */
function handleSpecialBoundaries(boundaries) {
  if (boundaries.isCrisis) {
    return {
      answer: `If you or someone you know is in crisis or distress, please reach out immediately:\n\n` +
              `• **Suicide & Crisis Lifeline:** Call or text **988** (Free, confidential, 24/7)\n` +
              `• **The Trevor Project (LGBTQ+ Youth):** Call **1-866-488-7386** or text **START to 678-678**\n` +
              `• **Ventura County Behavioral Health Crisis Line:** **1-866-998-2243**\n\n` +
              `DCVC offices do not provide 24/7 crisis monitoring. Please connect with these emergency lifelines for immediate care.`,
      citations: [{ title: "Crisis Lifelines", url: "/contact" }],
      boundaryTriggered: "crisis"
    };
  }

  if (boundaries.isMedical) {
    return {
      answer: `Ask DCVC cannot provide medical diagnoses, treatment plans, or clinical evaluations. ` +
              `However, Diversity Collective provides **free, confidential rapid HIV and STI screenings** (results in 15–20 minutes) ` +
              `and PrEP/PEP healthcare navigation through our **Diversity SHINES** clinic at our Community Resource Center ` +
              `(2471 Portola Road, Suite 100, Ventura) Monday–Friday from 1:00 PM to 5:00 PM. No insurance or payment is required. ` +
              `For urgent medical symptoms, please visit an urgent care center or call 911.`,
      citations: [
        { title: "Diversity SHINES Free Testing", url: "/programs/diversity-shines" },
        { title: "Contact Clinic", url: "/contact" }
      ],
      boundaryTriggered: "medical"
    };
  }

  if (boundaries.isLegal) {
    return {
      answer: `Ask DCVC cannot provide formal legal advice, representation, or counsel. ` +
              `Diversity Collective can connect community members with local LGBTQ+-affirming legal clinics and advocacy partners ` +
              `through our [Affirming Business Directory](/directory) or by contacting our team directly at [Contact Us](/contact).`,
      citations: [
        { title: "Affirming Directory", url: "/directory" },
        { title: "Contact Staff", url: "/contact" }
      ],
      boundaryTriggered: "legal"
    };
  }

  if (boundaries.isInjection) {
    return {
      answer: `I am Ask DCVC, the official community assistant for Diversity Collective Ventura County. ` +
              `I can only answer questions regarding DCVC programs, free clinical testing, youth groups, hours, and community resources. ` +
              `How can I assist you with our services today?`,
      citations: [{ title: "About DCVC", url: "/about" }],
      boundaryTriggered: "injection_blocked"
    };
  }

  return null;
}

/**
 * Synthesize verified answer deterministically when AI is offline or in simulation mode
 */
export function synthesizeVerifiedAnswer(bestMatch, query) {
  const q = query.toLowerCase();

  if (!bestMatch) {
    return {
      answer: `${EXACT_FALLBACK_MESSAGE} Visit our [Contact Page](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
      citations: [{ title: "Contact DCVC", url: DCVC_CONTACT_URL }]
    };
  }

  const citations = [{ title: bestMatch.title, url: bestMatch.officialUrl }];

  // 1. Events Inquiries (Must check for historical/past events like 2023/2024 before general keywords)
  if (q.includes("event") || q.includes("pride") || q.includes("gala") || q.includes("prom") || bestMatch.id === "events") {
    if (q.includes("2023") || q.includes("2024") || q.includes("past") || q.includes("last year")) {
      return {
        answer: `Past events (such as 2023 or 2024 Pride celebrations) have concluded and are not active. Our upcoming community celebrations include **Ventura County Pride** in August, the annual **Diversity Gala**, and the youth **Pride Prom**. View our live calendar at [Community Events](/events).`,
        citations: [{ title: "Community Events", url: "/events" }]
      };
    }
    if (!q.includes("free") && !q.includes("hiv")) {
      return {
        answer: `Diversity Collective hosts premier regional events including the seaside **Ventura County Pride Festival** (held each August at Promenade Park), the annual **Diversity Gala** benefit, and youth **Pride Prom**. Check our active schedules, tickets, and volunteer opportunities at [Events Calendar](/events).`,
        citations: [{ title: "Events Calendar", url: "/events" }]
      };
    }
  }

  // 2. Specific Program Priority: Diversity SHINES (HIV / STI / Screening)
  if (q.includes("hiv") || q.includes("sti") || q.includes("std") || q.includes("screening") || q.includes("prep") || q.includes("pep") || (bestMatch.id === "diversity-shines" && (q.includes("test") || q.includes("clinic")))) {
    if (q.includes("age") || q.includes("old") || q.includes("youth") || q.includes("teen")) {
      return {
        answer: `Confidential rapid HIV/STI testing through [Diversity SHINES](/programs/diversity-shines) is available for individuals **ages 12 and older** under California Minor Consent laws without requiring parental notification or insurance.`,
        citations
      };
    }
    return {
      answer: `Yes! Diversity Collective provides **free, confidential rapid HIV and STI screenings** (Hepatitis C, Syphilis, Chlamydia, Gonorrhea) through our [Diversity SHINES](/programs/diversity-shines) clinic at the Community Resource Center (2471 Portola Road, Suite 100, Ventura). Results are available in 15–20 minutes with zero insurance or payment required. Learn more at [Diversity SHINES](/programs/diversity-shines).`,
      citations
    };
  }

  // 3. Specific Program Priority: Donations & Giving (Must come before generic "fees" checks)
  if (q.includes("donate") || q.includes("donation") || q.includes("zeffy") || q.includes("contribute") || bestMatch.id === "donations") {
    return {
      answer: `You can support Diversity Collective at [Donate to DCVC](/donate). We use **Zeffy**, a 100% zero-fee nonprofit platform, ensuring 100% of your gift reaches local programs. All donations are tax-deductible under 501(c)(3) EIN: 46-5312131. Every donation unlocks an animated [DCVC Appreciation Card](/appreciation-card/preview) keepsake!`,
      citations: [{ title: "Donate via Zeffy", url: "/donate" }]
    };
  }

  // 4. Specific Program Priority: Affirming Business Directory
  if (q.includes("doctor") || q.includes("shop") || q.includes("store") || q.includes("business") || q.includes("directory") || bestMatch.id === "directory") {
    return {
      answer: `You can find affirming, LGBTQ+-friendly doctors, medical providers, shops, and professional services across Ventura County in our searchable [Affirming Business Directory](/directory). All listed businesses have signed the DCVC LGBTQ+ Affirming Pledge. Local business owners can submit listings at [Directory Submission](/directory/submit).`,
      citations: [{ title: "Affirming Directory", url: "/directory" }]
    };
  }

  // 5. Specific Program Priority: Training & Education
  if (bestMatch.id === "training" || q.includes("training") || q.includes("workshop") || q.includes("cultural competency")) {
    return {
      answer: `Diversity Collective offers professional LGBTQ+ cultural competency and workplace training. Fees are structured on a non-profit/civic sliding scale versus commercial rates based on workshop length and participant count. Organizations can request a customized fee proposal at [Training Booking](/training/book).`,
      citations
    };
  }

  // 6. Sponsors & Civic Partners
  if (q.includes("sponsor") || q.includes("partner") || q.includes("alliance") || bestMatch.id === "sponsors-partners") {
    return {
      answer: `Diversity Collective collaborates with foundational public health and civic partners including **Ventura County Behavioral Health (VCBH)**, **Ventura County Public Health (VCPH)**, and clinical testing programs like **Diversity SHINES**. To explore organizational partnerships or become an official sponsor, visit [Sponsors & Partners](/sponsors).`,
      citations: [{ title: "Sponsors & Partners", url: "/sponsors" }]
    };
  }

  // 6. General Service Cost inquiries (e.g. "Are your services free?")
  if (q.includes("free") || q.includes("cost") || q.includes("fee") || q.includes("pay") || q.includes("price")) {
    return {
      answer: `Yes! Services and programs provided by Diversity Collective — including [Community Resource Center](/programs/community-resource-center) drop-in access, [Diversity SHINES](/programs/diversity-shines) rapid HIV/STI testing, and [Rainbow Umbrella](/programs/rainbow-umbrella) youth groups — are **100% free of charge**. No insurance, payment, or membership fee is ever required.`,
      citations: [
        { title: "Free Programs", url: "/programs" },
        { title: "Community Resource Center", url: "/programs/community-resource-center" }
      ]
    };
  }

  // 2. Location / Address / Center inquiries
  if (q.includes("where") || q.includes("location") || q.includes("address") || q.includes("directions") || q.includes("portola")) {
    return {
      answer: `The Diversity Collective Community Resource Center is located at **2471 Portola Road, Suite 100, Ventura, CA 93003**. Drop-in hours are **Monday through Friday, 1:00 PM – 5:00 PM Pacific Time**. You can also reach the center at **(805) 644-LGBT**. Learn more at [Community Resource Center](/programs/community-resource-center).`,
      citations
    };
  }

  // 3. Hours inquiries
  if (q.includes("hour") || q.includes("open") || q.includes("when are you open") || q.includes("time")) {
    if (bestMatch.id === "rainbow-umbrella") {
      return {
        answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) meets every **Friday evening from 5:30 PM to 7:30 PM PT** at the Community Resource Center (2471 Portola Road, Suite 100, Ventura) for youth ages 13–23. It is 100% free.`,
        citations
      };
    }
    if (bestMatch.id === "little-unicorns") {
      return {
        answer: `[Little Unicorns](/programs/little-unicorns) meets on the **1st and 3rd Saturday of each month from 10:00 AM to 11:30 AM PT** at the Community Resource Center for children ages 9–13 and their parents/caregivers.`,
        citations
      };
    }
    return {
      answer: `The Community Resource Center is open for drop-in visits, computer lab access, and rapid testing **Monday through Friday from 1:00 PM to 5:00 PM PT**. It is closed on weekends and major holidays. Learn more at [Community Resource Center](/programs/community-resource-center).`,
      citations
    };
  }

  // 4. Age requirements
  if (q.includes("age") || q.includes("old") || q.includes("teen") || q.includes("kid") || q.includes("child")) {
    if (bestMatch.id === "rainbow-umbrella") {
      return {
        answer: `[Rainbow Umbrella](/programs/rainbow-umbrella) is strictly for youth and young adults **ages 13 through 23**. Children ages 9–13 attend our [Little Unicorns](/programs/little-unicorns) group on 1st & 3rd Saturdays. Adults 24+ can join our adult peer support circles.`,
        citations
      };
    }
    if (bestMatch.id === "little-unicorns") {
      return {
        answer: `[Little Unicorns](/programs/little-unicorns) is designed specifically for children **ages 9 through 13** and their parents/caregivers. Youth ages 13–23 can participate in [Rainbow Umbrella](/programs/rainbow-umbrella).`,
        citations
      };
    }
    if (bestMatch.id === "diversity-shines") {
      return {
        answer: `Confidential rapid HIV/STI testing through [Diversity SHINES](/programs/diversity-shines) is available for individuals **ages 12 and older** under California Minor Consent laws without requiring parental notification or insurance.`,
        citations
      };
    }
  }

  // 5. Events inquiries
  if (q.includes("event") || q.includes("pride") || q.includes("gala") || q.includes("prom")) {
    if (q.includes("2023") || q.includes("2024") || q.includes("past") || q.includes("last year")) {
      return {
        answer: `Past events (such as 2023 or 2024 Pride celebrations) have concluded and are not active. Our upcoming community celebrations include **Ventura County Pride** in August, the annual **Diversity Gala**, and the youth **Pride Prom**. View our live calendar at [Community Events](/events).`,
        citations
      };
    }
    return {
      answer: `Diversity Collective hosts premier regional events including the seaside **Ventura County Pride Festival** (held each August at Promenade Park), the annual **Diversity Gala** benefit, and youth **Pride Prom**. Check our active schedules, tickets, and volunteer opportunities at [Events Calendar](/events).`,
      citations
    };
  }

  // 6. Volunteering
  if (q.includes("volunteer") || q.includes("help out") || q.includes("get involved")) {
    return {
      answer: `We welcome community volunteers! Opportunities include Center greeters, Pride festival staff, health outreach, and workshop support. Volunteers working directly with youth (e.g. Rainbow Umbrella) must be 21+ and pass a Live Scan background check. Apply online at [Volunteer With Us](/volunteer).`,
      citations: [{ title: "Volunteer Application", url: "/volunteer" }]
    };
  }

  // 7. Donations & Giving
  if (q.includes("donate") || q.includes("donation") || q.includes("zeffy") || q.includes("contribute")) {
    return {
      answer: `You can support Diversity Collective at [Donate to DCVC](/donate). We use **Zeffy**, a 100% zero-fee nonprofit platform, ensuring 100% of your gift reaches local programs. All donations are tax-deductible under 501(c)(3) EIN: 46-5312131. Every donation unlocks an animated [DCVC Appreciation Card](/appreciation-card/preview) keepsake!`,
      citations: [{ title: "Donate via Zeffy", url: "/donate" }]
    };
  }

  // 8. Default synthesis based on matched summary and facts
  return {
    answer: `${bestMatch.summary} Key details: ${bestMatch.verifiedFacts.slice(0, 3).join("; ")}. For more information, visit [${bestMatch.title}](${bestMatch.officialUrl}).`,
    citations
  };
}

/**
 * Master Chat Processing Function
 */
export async function processChatRequest(userMessage, env = {}, clientIp = '') {
  // 1. Rate Limiting Check
  const rateLimit = checkRateLimit(clientIp, 10, 60000);
  if (!rateLimit.allowed) {
    return {
      success: false,
      status: 429,
      error: "Rate limit exceeded. Please wait a moment before sending another message.",
      rateLimitRemaining: 0,
      answer: "You have sent messages too quickly. Please wait a few seconds before asking another question to preserve our free community service."
    };
  }

  // 2. Validate & Sanitize Input
  const cleanMessage = (userMessage || '').trim().replace(/[\x00-\x1F\x7F]/g, '');
  if (!cleanMessage) {
    return {
      success: false,
      status: 400,
      error: "Message cannot be empty."
    };
  }

  if (cleanMessage.length > 300) {
    return {
      success: false,
      status: 400,
      error: "Message exceeds maximum length of 300 characters to conserve free community computing resources."
    };
  }

  // 3. Search Knowledge Base
  const searchResult = searchKnowledgeBase(cleanMessage);

  // 4. Handle Boundaries (Crisis, Medical, Legal, Injection)
  const boundaryResponse = handleSpecialBoundaries(searchResult.boundaries);
  if (boundaryResponse) {
    return {
      success: true,
      answer: boundaryResponse.answer,
      citations: boundaryResponse.citations,
      rateLimitRemaining: rateLimit.remaining,
      mode: "boundary"
    };
  }

  // 5. Fallback if no matching verified knowledge found
  if (searchResult.isFallbackRequired) {
    return {
      success: true,
      answer: `${EXACT_FALLBACK_MESSAGE} Please reach out at [Contact DCVC](${DCVC_CONTACT_URL}) or email info@diversitycollective.org.`,
      citations: [{ title: "Contact Us", url: DCVC_CONTACT_URL }],
      rateLimitRemaining: rateLimit.remaining,
      mode: "fallback"
    };
  }

  // 6. If Cloudflare Workers AI is available and enabled
  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const retrievedContext = buildRetrievedContext(searchResult.matches);
      const systemPrompt = buildChatbotSystemPrompt(retrievedContext);
      const model = env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fp8';

      const aiResponse = await env.AI.run(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanMessage }
        ],
        max_tokens: 384,
        temperature: 0.1
      });

      const rawAnswer = aiResponse?.response?.trim() || '';

      if (rawAnswer) {
        return {
          success: true,
          answer: rawAnswer,
          citations: searchResult.matches.map(m => ({ title: m.title, url: m.officialUrl })),
          rateLimitRemaining: rateLimit.remaining,
          mode: "workers-ai",
          model
        };
      }
    } catch (aiError) {
      console.warn("Workers AI execution fallback to deterministic engine:", aiError?.message || aiError);
      
      // If quota exceeded (HTTP 429 from Cloudflare AI)
      if (aiError?.status === 429 || aiError?.message?.includes('quota') || aiError?.message?.includes('limit')) {
        return {
          success: true,
          answer: "Ask DCVC has reached its daily complimentary conversation limit for today. You can still explore all our programs, services, and hours directly on the website, or reach our staff directly at info@diversitycollective.org.",
          citations: [
            { title: "Programs & Sanctuary", url: "/programs" },
            { title: "Contact DCVC", url: "/contact" }
          ],
          rateLimitRemaining: 0,
          mode: "quota-exceeded"
        };
      }
    }
  }

  // 7. Deterministic Verified Synthesis (for tests, dev mode, or zero-neuron offline operation)
  const synthesized = synthesizeVerifiedAnswer(searchResult.bestMatch, cleanMessage);
  return {
    success: true,
    answer: synthesized.answer,
    citations: synthesized.citations,
    rateLimitRemaining: rateLimit.remaining,
    mode: "verified-grounding"
  };
}
