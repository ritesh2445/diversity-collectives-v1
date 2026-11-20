import React, { useState } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  ShieldCheck, 
  Building,
  Store
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const QUESTIONS = [
  {
    id: 1,
    title: "All-Gender Restroom Dignity & Signage",
    question: "Are your single-occupancy restrooms designated as all-gender with compliant geometric signage per California Health & Safety Code § 118600?",
    options: [
      { label: "Yes, fully compliant with geometric all-gender signage", points: 20 },
      { label: "In progress or transitioning soon", points: 10 },
      { label: "Not yet or only gender-segregated restrooms exist", points: 0 }
    ],
    tip: "California law requires all single-user toilet facilities in any business establishment to be identified as all-gender."
  },
  {
    id: 2,
    title: "Frontline Greeting & Pronoun Etiquette",
    question: "Do customer-facing staff avoid assuming gender ('sir/ma'am') and use affirming, respectful greetings and chosen names?",
    options: [
      { label: "Yes, our team is trained in affirming, non-assumptive hospitality", points: 20 },
      { label: "Some staff do naturally, but no formal training provided", points: 10 },
      { label: "We haven't addressed this with our staff yet", points: 0 }
    ],
    tip: "A welcoming, gender-neutral greeting ('Welcome in folks / friends!') immediately builds safety and customer loyalty."
  },
  {
    id: 3,
    title: "Explicit Non-Discrimination Protections",
    question: "Does your business handbook or posted policy explicitly protect patrons and staff against discrimination based on sexual orientation, gender identity, and gender expression?",
    options: [
      { label: "Yes, written and communicated clearly to all team members", points: 20 },
      { label: "We have general values of inclusion, but nothing written down", points: 10 },
      { label: "No formal non-discrimination documentation", points: 0 }
    ],
    tip: "Explicit language protects both your team and your patrons under the California Fair Employment and Housing Act (FEHA)."
  },
  {
    id: 4,
    title: "De-Escalation & Safe Space Culture",
    question: "If a patron or team member experienced queerphobic harassment or discomfort in your establishment, is your staff trained to intervene and de-escalate?",
    options: [
      { label: "Yes, staff has clear safe space protocols and de-escalation training", points: 20 },
      { label: "Staff would do their best, but we have no standard procedure", points: 10 },
      { label: "No training on handling anti-LGBTQ+ harassment", points: 0 }
    ],
    tip: "DCVC accreditation teaches frontline de-escalation that protects staff and vulnerable patrons calmly and effectively."
  },
  {
    id: 5,
    title: "Visible Community Allyship",
    question: "Does your storefront or digital presence display visible signs of welcoming (e.g., DCVC Approved decal, Pride partnership, or pronoun pins)?",
    options: [
      { label: "Yes, we proudly display welcoming markers in our storefront / online", points: 20 },
      { label: "We welcome everyone silently, but don't display outward signs", points: 10 },
      { label: "Not currently displaying any affirming identifiers", points: 0 }
    ],
    tip: "Over 71% of LGBTQ+ patrons actively scan for physical welcoming decals before choosing to walk into a new business."
  }
];

export default function AffirmingReadinessQuiz() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = QUESTIONS[currentIdx];
  const totalQuestions = QUESTIONS.length;

  const handleSelectOption = (points) => {
    const updatedAnswers = { ...answers, [currentQ.id]: points };
    setAnswers(updatedAnswers);

    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsCompleted(true);
      try {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#10B981', '#F59E0B', '#3B82F6']
        });
      } catch {
        // Fallback
      }
    }
  };

  const calculateTotalScore = () => {
    return Object.values(answers).reduce((acc, pts) => acc + pts, 0);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  const score = calculateTotalScore();

  const getReadinessTier = (s) => {
    if (s >= 80) {
      return {
        tier: "Certification Ready! 🌟",
        color: "text-emerald-700 bg-emerald-50 border-emerald-300",
        barColor: "bg-emerald-500",
        headline: "Your business has exceptional welcoming foundations!",
        recommendation: "You are prime for our fast-track 2.5-hour DCVC Affirming Business Accreditation to earn your official storefront window decal and directory badge."
      };
    }
    if (s >= 50) {
      return {
        tier: "High Potential ✨",
        color: "text-purple-700 bg-purple-50 border-purple-300",
        barColor: "bg-purple-600",
        headline: "You have strong intentions with a few crucial policy gaps.",
        recommendation: "Our customized workshop will easily bridge your restroom signage, frontline etiquette, and legal protections to unlock full DCVC Approved status."
      };
    }
    return {
      tier: "Growth Opportunity 🌱",
      color: "text-amber-700 bg-amber-50 border-amber-300",
      barColor: "bg-amber-500",
      headline: "Great starting point — let's build your affirming roadmap!",
      recommendation: "Our foundational P.R.I.D.E. workshop will guide your management and staff step-by-step from terminology to California compliance."
    };
  };

  const resultTier = getReadinessTier(score);

  return (
    <div className="w-full rounded-3xl bg-white border-2 border-purple-200/90 shadow-xl p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border border-purple-200">
              <Sparkles className="w-3 h-3 text-[#5A1E65]" />
              60-SECOND SELF-AUDIT
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-950 mt-1">
              Is Your Business Ready for DCVC Approved Status?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Answer 5 quick questions to gauge your storefront readiness and discover your custom training track.
            </p>
          </div>

          {!isCompleted && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-500">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#5A1E65] to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* QUIZ CONTENT */}
        {!isCompleted ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                {currentQ.title}
              </span>
              <h4 className="font-display text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h4>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(opt.points)}
                  className="text-left p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 hover:shadow-md transition-all flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-800 group-hover:text-[#5A1E65]">
                    {opt.label}
                  </span>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-[#5A1E65] flex items-center justify-center shrink-0 group-hover:bg-[#5A1E65] transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>

            {/* Helpful Insight Tip */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Ventura County Insight:</strong> {currentQ.tip}</span>
            </div>
          </div>
        ) : (
          /* RESULT SCREEN */
          <div className="space-y-8 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="space-y-3 text-center md:text-left">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${resultTier.color}`}>
                  {resultTier.tier}
                </span>
                <h4 className="font-display text-2xl sm:text-3xl font-black text-slate-950">
                  {resultTier.headline}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
                  {resultTier.recommendation}
                </p>
              </div>

              {/* Big Score Radial Badge */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border-2 border-purple-200 shadow-lg shrink-0 w-44 text-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Readiness Score
                </span>
                <div className="font-display text-5xl font-black text-[#5A1E65] my-1">
                  {score}%
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                  <div className={`h-full ${resultTier.barColor}`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-2">
                  100 points maximum
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-2 px-4 rounded-full border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Self-Audit</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/training/dcvc-affirming-business"
                  className="btn-secondary py-3 px-5 text-xs font-bold w-full sm:w-auto text-center"
                >
                  View Accreditation Syllabus
                </Link>
                <Link
                  to="/training/dcvc-affirming-business/book"
                  className="btn-primary py-3 px-6 text-xs font-bold w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Book Fast-Track Workshop</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
