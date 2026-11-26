import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Ticket,
  ArrowUpRight,
  Share2,
  ShieldCheck,
  Check,
  Calendar,
  Download,
  AlertTriangle,
  Repeat,
  ArrowRight,
  Clock
} from 'lucide-react';
import { liveEvents, orgInfo } from '../data/dcvcData';
import { useLiveOrgInfo } from '../hooks/useCmsLive';
import SendVoicemailButton from '../components/SendVoicemailButton';
import { cmsStore } from '../services/cmsStore';
import { submitEventRsvp } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';
import CardSpotlight from '../components/CardSpotlight';
import AutoSlideImage from '../components/AutoSlideImage.jsx';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { usePageMeta } from '../utils/seo';
import { isPastEvent } from '../utils/eventDates';

export default function EventDetail() {
  const liveOrg = useLiveOrgInfo();
  const { slug } = useParams();
  const event = cmsStore.getEvents().find(e => e.slug === slug || e.id === slug) || liveEvents.find(e => e.slug === slug);
  const isExpired = event ? isPastEvent(event) : false;
  const [copied, setCopied] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    attendeeCount: 1,
    accommodations: '',
    turnstileToken: ''
  });
  const [rsvpStatus, setRsvpStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [rsvpMessage, setRsvpMessage] = useState('');

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;
    if (isExpired) {
      setRsvpStatus('error');
      setRsvpMessage('Registration for this event occurrence has closed because this event has concluded.');
      return;
    }
    setRsvpStatus('loading');
    setRsvpMessage('');

    const res = await submitEventRsvp({
      eventId: event.id || event.slug,
      eventTitle: event.title,
      eventDate: `${event.month} ${event.day}, ${event.year}`,
      eventTime: event.time,
      location: `${event.location}${event.address ? ` (${event.address})` : ''}`,
      organizerEmail: event.contactEmail || orgInfo.email,
      ...rsvpForm
    });

    if (res.success) {
      setRsvpStatus('success');
      setRsvpMessage(res.message);
    } else {
      setRsvpStatus('error');
      setRsvpMessage(res.message || 'Unable to submit RSVP.');
    }
  };

  usePageMeta({
    title: event ? event.title : 'Event Details',
    description: event ? event.description : 'Event and community calendar details for Diversity Collective Ventura County.',
    canonicalPath: event ? `/events/${event.slug}` : '/events',
    ogImage: event?.image
  });

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isWeeklyOrMonthly = event.slug.includes('weekly') || event.slug.includes('monthly') || event.title.toLowerCase().includes('weekly');

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">

      {/* Back button and Share */}
      <div className="container-clean mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cultural Calendar</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#5A1E65] py-1.5 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share Event'}</span>
        </button>
      </div>

      {/* Main Event Article */}
      <article className="container-clean">

        {/* Cancellation Alert Banner */}
        {event.isCancelled && (
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-display font-black text-sm uppercase tracking-wide block">Notice: Event Cancelled or Rescheduled</span>
              <span className="text-xs">Please contact {event.contactEmail || orgInfo.email} for revised event dates and questions.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pb-16 border-b border-slate-100">

          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                  {event.category}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {event.month} {event.day}, {event.year} · {event.time}
                </span>
                {isWeeklyOrMonthly && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>Recurring Program</span>
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-[1.08] break-words min-w-0">
                {event.title}
              </h1>
            </div>

            {/* Image Banner */}
            {(event.image || (Array.isArray(event.images) && event.images.length > 0)) && (
              <div className="rounded-3xl overflow-hidden aspect-[16/9] shadow-xl border-2 border-slate-200">
                <AutoSlideImage
                  images={Array.isArray(event.images) && event.images.length > 0 ? event.images : [event.image || '/images/community-gathering.jpg']}
                  alt={event.title}
                  aspectRatio="aspect-[16/9]"
                  className="w-full h-full"
                  imageFit="cover"
                  fallbackSrc="/images/community-gathering.jpg"
                  showDots={true}
                  showArrows={true}
                />
              </div>
            )}

            {/* Description Body */}
            <div className="space-y-4 text-base text-slate-600 leading-relaxed font-medium">
              <h2 className="font-display text-2xl font-black text-slate-950">
                About This Event
              </h2>
              <p>
                {event.description}
              </p>
              <p>
                Diversity Collective Ventura County programs are grounded in cultural affirmation, trauma-informed care, and welcoming community spaces. All participants are respected regardless of identity or expression.
              </p>
            </div>

            {/* Add to Calendar Button Row */}
            <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Add Event to Your Calendar</span>
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => downloadIcsFile(event)}
                  className="py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-purple-500 text-slate-900 text-xs font-bold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#5A1E65]" />
                  <span>Download .ICS (Apple & Outlook)</span>
                </button>

                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#5A1E65] !text-white text-xs font-bold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 hover:bg-[#43144A]"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span className="!text-white font-bold">Add to Google Calendar</span>
                  <ArrowUpRight className="w-3 h-3 !text-white" />
                </a>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              {isExpired ? (
                <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-2xl text-xs text-slate-700 font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Registration Closed for this Occurrence — This event has concluded.</span>
                </div>
              ) : event.slug === 'free-hiv-sti-screening' ? (
                <Link
                  to="/appointments"
                  className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Book Confidential Screening Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : event.registrationUrl ? (
                event.registrationUrl.startsWith('http') ? (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Ticket className="w-4 h-4 text-amber-300" />
                    <span>Official Registration / RSVP</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    to={event.registrationUrl}
                    className="btn-primary py-3.5 px-7 text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Ticket className="w-4 h-4 text-amber-300" />
                    <span>Official Registration / RSVP</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Free Drop-in Event. Reserve your spot below for instant email reminders.</span>
                </div>
              )}

              <a
                href={`mailto:${event.contactEmail || orgInfo.email}?subject=Inquiry%20about%20${encodeURIComponent(event.title)}`}
                className="btn-secondary py-3.5 px-6 text-sm font-bold inline-flex items-center gap-2 bg-white"
              >
                <Mail className="w-4 h-4 text-purple-600" />
                <span>Contact Organizer</span>
              </a>
            </div>

            {/* Direct Event RSVP & Email Confirmation Form */}
            {!event.isCancelled && (
              isExpired ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-100/90 border-2 border-slate-300 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <span className="font-display text-lg font-black">Registration Closed for this Occurrence</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    This event has already taken place. Please check our community calendar to join upcoming circles, workshops, and celebrations.
                  </p>
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 btn-secondary py-2.5 px-5 text-xs font-bold"
                  >
                    <span>View Upcoming Events</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#5A1E65]" />
                  </Link>
                </div>
              ) : event.slug === 'free-hiv-sti-screening' ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-50 via-teal-50/40 to-white border-2 border-purple-200 shadow-lg space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    Confidential Slot Booking System
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950">
                    Book a Free HIV & STI Screening Time Slot
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    Screenings take place every 1st Monday of the month from 3:00 PM – 7:00 PM at DCVC CRC (2471 Portola Rd, Suite 100). Certified HIV counselors provide confidential 15-minute rapid testing plus STI panels (syphilis, chlamydia, gonorrhea).
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/appointments"
                      className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-xl"
                    >
                      <Ticket className="w-4 h-4 text-amber-300" />
                      <span>Choose Date & Reserved Time Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-purple-100 shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5A1E65] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      Instant Email Confirmation
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 mt-2">
                      RSVP for {event.title}
                    </h3>
                  </div>
                </div>

                {rsvpStatus === 'success' ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span>RSVP Confirmed!</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">{rsvpMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpStatus('idle');
                        setRsvpForm({ attendeeName: '', attendeeEmail: '', attendeePhone: '', attendeeCount: 1, accommodations: '', turnstileToken: '' });
                      }}
                      className="text-xs font-bold text-[#5A1E65] underline cursor-pointer pt-1"
                    >
                      Register another guest
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-4">
                    {rsvpStatus === 'error' && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
                        {rsvpMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="event-rsvp-name" className="block text-xs font-bold text-slate-700 mb-1">
                          Your Name / Chosen Name *
                        </label>
                        <input
                          id="event-rsvp-name"
                          type="text"
                          required
                          value={rsvpForm.attendeeName}
                          onChange={(e) => setRsvpForm({ ...rsvpForm, attendeeName: e.target.value })}
                          placeholder="e.g. Jordan Rivera"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="event-rsvp-email" className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          id="event-rsvp-email"
                          type="email"
                          required
                          value={rsvpForm.attendeeEmail}
                          onChange={(e) => setRsvpForm({ ...rsvpForm, attendeeEmail: e.target.value })}
                          placeholder="you@domain.org"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="event-rsvp-phone" className="block text-xs font-bold text-slate-700 mb-1">
                          Phone (Optional)
                        </label>
                        <input
                          id="event-rsvp-phone"
                          type="tel"
                          value={rsvpForm.attendeePhone}
                          onChange={(e) => setRsvpForm({ ...rsvpForm, attendeePhone: e.target.value })}
                          placeholder="(805) 555-0199"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="event-rsvp-count" className="block text-xs font-bold text-slate-700 mb-1">
                          Number of Attendees
                        </label>
                        <select
                          id="event-rsvp-count"
                          value={rsvpForm.attendeeCount}
                          onChange={(e) => setRsvpForm({ ...rsvpForm, attendeeCount: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                            <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="event-rsvp-accommodations" className="block text-xs font-bold text-slate-700 mb-1">
                        Accessibility Accommodations or Notes (Optional)
                      </label>
                      <textarea
                        id="event-rsvp-accommodations"
                        rows={2}
                        value={rsvpForm.accommodations}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, accommodations: e.target.value })}
                        placeholder="ASL interpretation, sensory accommodations, dietary notes, etc."
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#5A1E65] focus:ring-2 focus:ring-purple-200 outline-none"
                      />
                    </div>

                    <TurnstileWidget onVerify={(tok) => setRsvpForm((prev) => ({ ...prev, turnstileToken: tok }))} />

                    <button
                      type="submit"
                      disabled={rsvpStatus === 'loading'}
                      className="btn-primary py-3 px-7 text-sm font-black inline-flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                    >
                      <Mail className="w-4 h-4 text-amber-300" />
                      <span>{rsvpStatus === 'loading' ? 'Sending RSVP Confirmation...' : 'Confirm RSVP & Email Ticket'}</span>
                    </button>
                  </form>
                )}
              </div>
              )
            )}
          </div>

          {/* Sidebar Logistics Card */}
          <div className="lg:col-span-4 sticky top-28">
            <CardSpotlight
              className="bg-slate-50/90 p-8 rounded-3xl border-2 border-slate-200 shadow-xl space-y-6"
              tilt={true}
              maxTilt={5}
              glare={true}
            >

              {/* Date Box */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                <div className="flex flex-col items-center justify-center min-w-[76px] p-3 rounded-2xl bg-gradient-to-b from-[#5A1E65] to-purple-900 text-white shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">{event.month}</span>
                  <span className="font-display text-2xl font-black">{event.day}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">DATE & TIME</span>
                  <p className="font-black text-slate-900 text-sm sm:text-base">{event.month} {event.day}, {event.year}</p>
                  <p className="text-xs text-slate-600 font-medium">{event.time}</p>
                </div>
              </div>

              {/* Location Box */}
              <div className="space-y-2 pb-6 border-b border-slate-200">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">LOCATION</span>
                <p className="font-bold text-slate-900 text-sm">{event.location}</p>
                <p className="text-xs text-slate-600 font-medium">{event.address}</p>
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A1E65] hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Map Directions</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Host & Questions */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">ORGANIZER</span>
                <p className="font-bold text-slate-900 text-sm">Diversity Collective Ventura County</p>
                <p className="text-xs text-slate-600 font-medium break-words">
                  Email: <a href={`mailto:${event.contactEmail || orgInfo.email}`} className="text-[#5A1E65] hover:underline font-bold break-all">{event.contactEmail || orgInfo.email}</a>
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {liveOrg.voicemailOnly ? <SendVoicemailButton label="Send Voice Message" subject={`Question about ${event.title}`} compact /> : <>Phone: <a href={`tel:${liveOrg.phoneRaw || orgInfo.phoneRaw}`} className="text-[#5A1E65] hover:underline font-bold">{liveOrg.phone || orgInfo.phone}</a></>}
                </p>
              </div>

            </CardSpotlight>
          </div>

        </div>
      </article>

    </div>
  );
}
