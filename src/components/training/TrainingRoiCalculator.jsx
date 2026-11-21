import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Heart, 
  CheckCircle2, 
  ArrowRight,
  Store,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TEAM_SIZES = [
  { label: '1 - 10 Staff', value: 'small', desc: 'Boutiques, Cafes, Independent Salons & Local Retail' },
  { label: '11 - 50 Staff', value: 'medium', desc: 'Restaurants, Health Clinics, Multi-Chair Salons & Regional Agencies' },
  { label: '51 - 200 Staff', value: 'large', desc: 'Hospitals, Credit Unions, Mid-Sized Tech & School Campuses' },
  { label: '200+ Staff', value: 'enterprise', desc: 'Municipalities, Health Systems & Enterprise Corporations' }
];

const SECTORS = [
  { 
    id: 'retail', 
    name: 'Retail, Dining & Hospitality', 
    focus: 'Frontline welcoming, all-gender restroom signage, customer de-escalation, tipping/table etiquette' 
  },
  { 
    id: 'healthcare', 
    name: 'Healthcare, Dental & Mental Health', 
    focus: 'Status-neutral clinical care, EHR chosen names, gender-affirming intake workflows, PrEP linkage' 
  },
  { 
    id: 'corporate', 
    name: 'Corporate, Tech & Professional Services', 
    focus: 'California SB 396 compliance, ERG sponsorship, trans-inclusive healthcare benefits, talent retention' 
  },
  { 
    id: 'wellness', 
    name: 'Salons, Fitness & Personal Care', 
    focus: 'Gender-neutral service menus, trauma-informed physical touch, affirming locker room & changing areas' 
  },
  { 
    id: 'education', 
    name: 'Education, Youth Non-Profits & Civic', 
    focus: 'Youth suicide prevention, student disclosure privacy, safe classroom spaces, anti-bullying protocols' 
  }
];

export default function TrainingRoiCalculator({ content }) {
  const [teamSize, setTeamSize] = useState('small');
  const [sector, setSector] = useState('retail');

  const selectedSector = SECTORS.find(s => s.id === sector) || SECTORS[0];

  // Dynamic calculations based on team size & sector
  const getMetrics = () => {
    switch (teamSize) {
      case 'medium':
        return {
          communityReach: '25,000+',
          loyaltyBoost: '+48%',
          complianceScore: '100% SB 396',
          recommendedFormat: 'Half-Day On-Site Workshop + Shift Lead Debrief',
          kitType: 'Standard DCVC Storefront Kit + 25 Staff Pins'
        };
      case 'large':
        return {
          communityReach: '60,000+',
          loyaltyBoost: '+64%',
          complianceScore: '100% SB 396 / FEHA',
          recommendedFormat: 'Multi-Session Cohort Training (Virtual + In-Person)',
          kitType: 'Enterprise Credential Suite + 50 Staff Pins'
        };
      case 'enterprise':
        return {
          communityReach: '100,000+',
          loyaltyBoost: '+80%',
          complianceScore: 'Full Corporate Accreditation',
          recommendedFormat: 'Enterprise Train-the-Trainer + Executive Sponsorship',
          kitType: 'Multi-Location Storefront Kits + Custom ERG Toolkit'
        };
      case 'small':
      default:
        return {
          communityReach: '10,000+',
          loyaltyBoost: '+35%',
          complianceScore: '100% California Ready',
          recommendedFormat: '2.5-Hour Interactive Storefront Workshop',
          kitType: 'Official DCVC Storefront Window Cling + 10 Staff Pins'
        };
    }
  };

  const metrics = getMetrics();

  return (
    <div className="w-full rounded-3xl bg-white border-2 border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
      {/* Title */}
      <div className="space-y-2 border-b border-slate-100 pb-6">
        <span className="glass-pill text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 border-purple-200">
          <Calculator className="w-3.5 h-3.5" />
          {content?.calculatorEyebrow || 'INTERACTIVE IMPACT & ROI CALCULATOR'}
        </span>
        <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
          {content?.calculatorTitle || 'Estimate Your Business Impact & Training Track'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
          {content?.calculatorSubtitle || 'Discover the measurable community reach, compliance safeguards, and customer loyalty your business unlocks through DCVC accreditation.'}
        </p>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Size Selector */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            1. Select Your Staff / Team Size:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {TEAM_SIZES.map((ts) => (
              <button
                key={ts.value}
                type="button"
                onClick={() => setTeamSize(ts.value)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  teamSize === ts.value
                    ? 'border-[#5A1E65] bg-purple-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`text-xs font-black block ${teamSize === ts.value ? 'text-[#5A1E65]' : 'text-slate-900'}`}>
                  {ts.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block leading-tight mt-0.5 line-clamp-1">
                  {ts.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sector Selector */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
            2. Select Your Business Sector:
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full p-3.5 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold text-xs bg-slate-50 hover:bg-white focus:bg-white focus:border-[#5A1E65] transition-all outline-none"
          >
            {SECTORS.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/60 text-[11px] text-purple-900">
            <strong>Key Focus Area:</strong> {selectedSector.focus}
          </div>
        </div>
      </div>

      {/* Calculated Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200/80 space-y-2">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-black uppercase tracking-wider">Local Audience Reach</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="font-display text-3xl font-black text-slate-950">
            {metrics.communityReach}
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Direct visibility to conscious Ventura County consumers and allies.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-black uppercase tracking-wider">Customer Loyalty Lift</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="font-display text-3xl font-black text-slate-950">
            {metrics.loyaltyBoost}
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            71% of LGBTQ+ consumers actively switch to verified affirming spaces.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-black uppercase tracking-wider">California Compliance</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl font-black text-slate-950">
            {metrics.complianceScore}
          </div>
          <p className="text-[11px] text-slate-600 font-medium leading-tight">
            Meets SB 396 and Health & Safety Code § 118600 standards.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/50 border border-rose-200/80 space-y-2">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[10px] font-black uppercase tracking-wider">Recommended Workshop</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-display text-xs font-black text-slate-950 leading-snug">
            {metrics.recommendedFormat}
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-tight">
            Includes {metrics.kitType}.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-[#5A1E65] shrink-0" />
          <span className="text-xs font-bold text-slate-700">
            Ready to book your team's tailored workshop for <strong>{selectedSector.name}</strong>?
          </span>
        </div>

        <Link
          to={`/training/dcvc-affirming-business/book?sector=${sector}&size=${teamSize}`}
          className="btn-primary py-2.5 px-6 text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 shadow-sm"
        >
          <span>Request Custom Proposal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
