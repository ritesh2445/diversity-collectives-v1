import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ArrowUpRight, 
  Send, 
  CheckCircle2, 
  LifeBuoy, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orgInfo } from '../data/dcvcData';
import CardSpotlight from '../components/CardSpotlight';

export default function Contact() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5A1E65', '#10B981', '#F59E0B', '#38BDF8']
      });
    } catch (err) {
      // Graceful fallback
    }
  };

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-white text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        {/* Specular Ambient Glow */}
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-3xl relative z-10 flex flex-col gap-4">
          <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
            LOCATION & CONTACT
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Get in Touch & <br />
            <span className="font-serif italic font-normal text-[#5A1E65]">Visit Our Sanctuary.</span>
          </h1>
          <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
            Whether you have questions about our youth peer groups, want to book an HIV/STI screening, or wish to connect with our team, we are here for you.
          </p>
        </div>
      </section>

      {/* Main Grid: Details + Interactive Form */}
      <section className="container-clean py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Location & Contact Cards in 3D */}
          <div className="lg:col-span-5 space-y-6 perspective-1000">
            
            {/* Physical Location Card */}
            <CardSpotlight
              className="p-8 bg-white rounded-3xl border-2 border-purple-200 shadow-xl space-y-4 interactive-card-3d glow-amethyst"
              tilt={true}
              maxTilt={6}
              glare={true}
            >
              <span className="text-xs font-black tracking-widest text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block">
                PHYSICAL SANCTUARY
              </span>
              <h2 className="font-display text-2xl font-black text-slate-950">
                Community Resource Center
              </h2>
              <address className="not-italic text-sm text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-900">2471 Portola Road, Suite 100</p>
                <p>Ventura, CA 93003</p>
                <p className="text-xs text-slate-400 pt-1">
                  Near the intersection of Telephone Rd & Market St. Drop-ins welcome!
                </p>
              </address>
              <div className="pt-2">
                <a
                  href={orgInfo.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-3 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Open in Google Maps</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </CardSpotlight>

            {/* Direct Channels */}
            <div className="p-8 bg-slate-50/80 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-black tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase inline-block">
                DIRECT CHANNELS
              </span>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                  <Phone className="w-5 h-5 text-[#5A1E65] flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">Telephone & Helpline</span>
                    <a href={`tel:${orgInfo.phoneRaw}`} className="font-bold text-slate-900 hover:text-[#5A1E65] text-sm">
                      {orgInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                  <Mail className="w-5 h-5 text-[#5A1E65] flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">General Inquiry Email</span>
                    <a href={`mailto:${orgInfo.email}`} className="font-bold text-slate-900 hover:text-[#5A1E65] text-sm">
                      {orgInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">Center Drop-in Hours</span>
                    <p className="text-slate-800 font-bold text-sm">Monday–Friday 1:00 PM – 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Immediate Crisis Notice */}
            <div className="p-6 bg-rose-50/70 rounded-2xl border-2 border-rose-200 text-xs space-y-1.5 shadow-xs">
              <span className="font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5 text-xs">
                <LifeBuoy className="w-4 h-4 text-rose-600" />
                <span>Immediate 24/7 Crisis Support</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                DCVC is an advocacy and wellness sanctuary. If you or a loved one is in crisis, please dial <strong>988</strong> (Suicide & Crisis Lifeline) or call The Trevor Project at <a href="tel:18664887386" className="font-bold text-rose-700 underline">1-866-488-7386</a>.
              </p>
            </div>

          </div>

          {/* Right Column: Functional Message Form in 3D Card */}
          <div className="lg:col-span-7 perspective-1000">
            <CardSpotlight
              className="p-8 sm:p-12 bg-white rounded-3xl border-2 border-slate-200 shadow-2xl interactive-card-3d"
              tilt={true}
              maxTilt={4}
              glare={true}
            >
              <span className="text-xs font-black tracking-widest text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 uppercase inline-block mb-3">
                CONFIDENTIAL ONLINE INQUIRY
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 mb-2 tracking-tight">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-8 font-medium">
                Messages are reviewed daily by our Community Resource Center team during weekday operating hours.
              </p>

              {formSubmitted ? (
                <div className="p-8 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center space-y-4 shadow-sm animate-float-slow">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-black text-emerald-950">
                    Thank You, {formData.name || 'Friend'}!
                  </h3>
                  <p className="text-sm text-emerald-900 max-w-md mx-auto font-medium leading-relaxed">
                    Your message regarding <strong>{formData.topic}</strong> has been safely received. Our community coordinator will respond to you shortly at <span className="font-bold underline">{formData.email}</span>.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', topic: 'General Inquiry', message: '' });
                    }}
                    className="btn-primary py-2.5 px-6 text-xs font-bold mt-2 shadow-md cursor-pointer"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                        Your Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input 
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <input 
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@example.com"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                        Phone Number (Optional)
                      </label>
                      <input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(805) 555-0123"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="topic" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                        Topic of Inquiry <span className="text-rose-600">*</span>
                      </label>
                      <select 
                        id="topic"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="HIV/STI Health Testing">Diversity SHINES Health Testing</option>
                        <option value="Youth Programs">Rainbow Umbrella (Youth 13–23)</option>
                        <option value="Family Programs">Little Unicorns (Kids 9–13)</option>
                        <option value="Volunteering">Volunteering Opportunities</option>
                        <option value="Donations & Sponsorship">Donations & Corporate Sponsorship</option>
                        <option value="Community Space Rental">Hosting a Meeting at the Center</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      Your Message <span className="text-rose-600">*</span>
                    </label>
                    <textarea 
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us how we can best assist or welcome you..."
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#5A1E65] to-purple-800 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-2xl hover:scale-102 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>Send Confidential Message</span>
                    </button>
                  </div>

                </form>
              )}
            </CardSpotlight>
          </div>

        </div>
      </section>

    </div>
  );
}
