import React, { useState } from 'react';
import { Star, X, Check, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { directoryService } from '../services/directoryService';

export default function DirectoryRateModal({ business, isOpen, onClose, onRated }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !business) return null;

  const labels = {
    1: 'Needs Improvement',
    2: 'Fair Experience',
    3: 'Good & Affirming',
    4: 'Very Welcoming & Safe',
    5: 'Exceptional LGBTQ+ Sanctuary! 🌈'
  };

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await directoryService.rateBusiness(business.id || business.slug, rating);
      
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#5A1E65', '#EC4899', '#F59E0B', '#10B981']
        });
      } catch (_) {}

      setSubmitted(true);
      if (onRated) onRated(result);

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Rate failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-purple-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-[#5A1E65] via-pink-500 to-amber-400" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="font-display text-xl font-black text-slate-950">Thank You for Rating!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                The overall rating for <strong className="text-slate-900">{business.name}</strong> has been recalculated and updated live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Community Voice
                </span>
                <h3 className="font-display text-2xl font-black text-slate-950 mt-1">
                  Rate {business.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  How was your experience with this affirming space?
                </p>
              </div>

              {/* Star Rating Selector */}
              <div className="flex flex-col items-center py-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-120 active:scale-95"
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= activeRating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-[#5A1E65] mt-2 tracking-wide">
                  {labels[activeRating]}
                </span>
              </div>

              {/* Privacy & Authentic Calculation Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authentic & Privacy-Preserving</span>
                </div>
                <p className="leading-relaxed">
                  Individual text comments are not displayed to protect community member privacy and prevent spam. Your rating instantly recalculates the public overall score.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md hover:shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Rating'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
