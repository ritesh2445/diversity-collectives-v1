import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';

export default function NewsletterSignup({ className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please provide a valid email address.');
      return;
    }

    setStatus('loading');
    const res = await subscribeNewsletter(email);
    if (res.success) {
      setStatus('success');
      setMessage(res.message);
      setEmail('');
    } else {
      setStatus('error');
      setMessage(res.message || 'Subscription failed. Please try again.');
    }
  };

  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#33083F] via-[#5A1E65] to-purple-950 text-white shadow-2xl relative overflow-hidden ${className}`}>
      {/* Specular Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-amber-400/30">
          <Mail className="w-3.5 h-3.5" />
          <span>COMMUNITY DISPATCH & NEWSLETTER</span>
        </span>

        <h2 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
          Stay Connected with Ventura County LGBTQ+ News
        </h2>

        <p className="text-xs sm:text-sm text-purple-100 leading-relaxed max-w-xl mx-auto font-medium">
          Get monthly announcements on free HIV/STI screening clinics, Rainbow Umbrella youth circles, annual Pride festival updates, and mutual aid opportunities. No spam, ever.
        </p>

        {status === 'success' ? (
          <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3 pt-2 max-w-lg mx-auto">
            <div className="relative flex-grow">
              <Mail className="w-4 h-4 text-purple-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200/70 focus:bg-white/20 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="py-3.5 px-7 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg hover:shadow-xl hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 disabled:opacity-50"
            >
              <span>{status === 'loading' ? 'Joining...' : 'Subscribe'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-xs text-rose-300 font-bold flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </p>
        )}

        <div className="pt-2 text-[11px] text-purple-200/80 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>We respect your privacy. Unsubscribe anytime with one click.</span>
        </div>
      </div>
    </div>
  );
}

