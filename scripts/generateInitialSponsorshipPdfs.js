import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const dir = path.join(process.cwd(), 'public', 'documents', 'sponsorships');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function addHeader(doc, title, subtitle) {
  doc.setFillColor(90, 30, 101); // #5A1E65
  doc.rect(0, 0, 210, 36, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DIVERSITY COLLECTIVE VENTURA COUNTY', 15, 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle.toUpperCase(), 15, 24);
  doc.text('Community Resource Center · 2471 Portola Rd, Suite 100, Ventura, CA · (805) 644-5428', 15, 30);
  
  doc.setDrawColor(245, 158, 11); // Amber accent line
  doc.setLineWidth(1.5);
  doc.line(0, 36, 210, 36);
}

function addFooter(doc) {
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.5);
  doc.line(15, 275, 195, 275);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text('Diversity Collective Ventura County · 501(c)(3) Nonprofit Org · EIN 46-5312131 · info@diversitycollective.org', 15, 282);
  doc.text('diversitycollectivevc.org/sponsorships', 145, 282);
}

// 1. Cover Letter
{
  const doc = new jsPDF();
  addHeader(doc, 'COVER LETTER', '2027 Corporate Sponsorship & Partnership Invitation');
  
  doc.setTextColor(30, 30, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DCVC 2027 Sponsorship Cover Letter', 15, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Date: Official 2027 Campaign', 15, 58);
  doc.text('To: Corporate Partners, Civic Leaders & Community Allies', 15, 64);
  doc.text('From: Executive Leadership & Board of Directors, Diversity Collective Ventura County', 15, 70);
  
  doc.setDrawColor(230, 230, 235);
  doc.line(15, 76, 195, 76);
  
  const text1 = 'Dear Community Partner,';
  const text2 = 'On behalf of Diversity Collective Ventura County (DCVC), we invite your organization to join us as an official 2027 Corporate Sponsor. For over a decade, DCVC has served as the anchor community resource center and public health champion for LGBTQ+ individuals, youth, and families across all ten cities of Ventura County.';
  const text3 = 'Corporate sponsorship directly powers life-saving programs: free confidential HIV and STI screenings in our clinical rooms, weekly drop-in safe spaces for LGBTQ+ teens via Rainbow Umbrella, vital support circles for transgender community members, and cultural gatherings including the landmark Ventura County Pride Festival.';
  const text4 = 'Our partnership model is built on tangible community impact, authentic visibility, and reciprocal value. By partnering with DCVC, your organization affirms its commitment to diversity, equity, and inclusion while connecting with a vibrant, loyal regional audience.';
  const text5 = 'We welcome you to review the enclosed 2027 Sponsorship Opportunities Packet and Strategic Partnership Proposal. Our team is eager to tailor a partnership that aligns with your corporate social responsibility goals and employee engagement interests.';
  const text6 = 'With gratitude and solidarity,';
  
  let y = 86;
  [text1, text2, text3, text4, text5, text6].forEach(p => {
    const lines = doc.splitTextToSize(p, 180);
    doc.text(lines, 15, y);
    y += (lines.length * 5) + 6;
  });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Roland Catabona', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text('President, Board of Directors', 15, y + 5);
  doc.text('Diversity Collective Ventura County', 15, y + 10);
  
  addFooter(doc);
  fs.writeFileSync(path.join(dir, 'dcvc-2027-sponsorship-cover-letter.pdf'), Buffer.from(doc.output('arraybuffer')));
}

// 2. Opportunities Packet
{
  const doc = new jsPDF();
  addHeader(doc, 'OPPORTUNITIES PACKET', '2027 Sponsorship Investment Tiers & Partner Benefits');
  
  doc.setTextColor(30, 30, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DCVC 2027 Sponsorship Opportunities Packet', 15, 48);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const intro = 'DCVC offers structured corporate sponsorship tiers designed to provide meaningful brand alignment, premier recognition at our major regional events, and genuine community investment across Ventura County.';
  doc.text(doc.splitTextToSize(intro, 180), 15, 56);
  
  const tiers = [
    { name: '1. PREMIER CORPORATE PARTNER ($25,000+)', desc: 'Top-tier title alignment across Ventura County Pride, Health & Wellness Fairs, year-round Center naming recognition, VIP executive gala passes, prime banner placement, and dedicated social spotlights to 25,000+ followers.' },
    { name: '2. MAJOR COMMUNITY SPONSOR ($10,000 - $24,999)', desc: 'Official sponsor of key program tracks (Youth Safe Sanctuaries or Diversity SHINES clinical suites), prominent stage recognition, premium festival exhibition booth, and feature spotlight in quarterly DCVC newsletters.' },
    { name: '3. SPECIALTY & EVENT PARTNER ($5,000 - $9,999)', desc: 'Targeted activation sponsorship for specific DCVC signature programs (e.g. Pride Prom, AIDS Walk Ventura, or Diversity Toastmasters), brand signage, and employee volunteer engagement packages.' },
    { name: '4. COMMUNITY ALLY ($1,500 - $4,999)', desc: 'Storefront and local business sponsorship, official DCVC Approved badge accreditation, directory listing, and recognition in event digital guides.' },
    { name: '5. IN-KIND PARTNERSHIP (Valued Gift-in-Kind)', desc: 'Essential hardware, technology workstations, clinic supplies, event catering, professional pro-bono services, and media production supporting DCVC operations.' }
  ];
  
  let y = 68;
  tiers.forEach(t => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 30, 101);
    doc.text(t.name, 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 60);
    const descLines = doc.splitTextToSize(t.desc, 180);
    doc.text(descLines, 15, y);
    y += (descLines.length * 4.5) + 6;
  });
  
  doc.setFillColor(248, 245, 252);
  doc.roundedRect(15, y, 180, 24, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(90, 30, 101);
  doc.text('Partnership Commitment & Inquiries:', 20, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 50);
  doc.text('Email info@diversitycollective.org or call (805) 644-5428 to confirm your tier or request customized activations.', 20, y + 16);
  
  addFooter(doc);
  fs.writeFileSync(path.join(dir, 'dcvc-2027-sponsorship-opportunities-packet.pdf'), Buffer.from(doc.output('arraybuffer')));
}

// 3. Strategic Proposal
{
  const doc = new jsPDF();
  addHeader(doc, 'STRATEGIC PROPOSAL', '2027 Strategic Corporate Partnership Blueprint');
  
  doc.setTextColor(30, 30, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DCVC 2027 Strategic Partnership Proposal', 15, 48);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const proposalIntro = 'Diversity Collective Ventura County (DCVC) presents a comprehensive strategic proposal aligning corporate social responsibility, civic impact, and LGBTQ+ community empowerment.';
  doc.text(doc.splitTextToSize(proposalIntro, 180), 15, 56);
  
  const pillars = [
    { title: 'PILLAR I: ADVOCACY & CIVIC VISIBILITY', body: 'Leading public education, pride celebrations, and municipal advocacy ensuring every LGBTQ+ individual across Ventura County is represented, respected, and protected by strong local civic policy.' },
    { title: 'PILLAR II: COMMUNITY WELLNESS & CLINICAL HEALTH', body: 'Operating free rapid HIV/STI testing, peer-led support groups, and regional partnerships with Ventura County Behavioral Health and Public Health to close healthcare disparities.' },
    { title: 'PILLAR III: SAFE YOUTH & TEEN SANCTUARIES', body: 'Funding Rainbow Umbrella youth drop-in spaces, peer circles, and mentorship that reduce isolation, combat bullying, and empower young leaders in a safe, affirming environment.' },
    { title: 'PILLAR IV: REGIONAL REACH & CORPORATE ENGAGEMENT', body: 'Engaging over 20,000 community members annually across Ventura, Oxnard, Camarillo, Thousand Oaks, Simi Valley, Ojai, and Moorpark. Partner benefits include employee DEI workshops, corporate volunteering, and brand goodwill.' }
  ];
  
  let y = 68;
  pillars.forEach(p => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 30, 101);
    doc.text(p.title, 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 60);
    const bodyLines = doc.splitTextToSize(p.body, 180);
    doc.text(bodyLines, 15, y);
    y += (bodyLines.length * 4.5) + 6;
  });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('Custom Partnership Structuring:', 15, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('We co-create multi-year strategic alliances tailored to your corporate mission, foundation guidelines, and regional footprint.', 15, y + 10);
  
  addFooter(doc);
  fs.writeFileSync(path.join(dir, 'dcvc-2027-strategic-partnership-proposal.pdf'), Buffer.from(doc.output('arraybuffer')));
}

console.log('Successfully generated all 3 initial sponsorship PDF documents in public/documents/sponsorships/');
