import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Mail,
  BookOpen,
  Calendar,
  FileText,
  Camera,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Search,
  ExternalLink,
  Phone,
  MapPin,
  Clock,
  Award,
  ShieldAlert,
  Heart,
  Layers,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import ImagePicker from './ImagePicker.jsx';
import PictureFolderManager from './PictureFolderManager.jsx';
import StyleCustomizer from './StyleCustomizer.jsx';
import NewsWritingPad from './NewsWritingPad.jsx';
import {
  getLiveCmsData,
  saveLiveCmsData,
  resetCmsToDefault,
  saveCmsProgram,
  deleteCmsProgram,
  saveCmsEvent,
  deleteCmsEvent,
  toggleCmsEventCancel,
  saveCmsArticle,
  deleteCmsArticle,
  saveCmsResource,
  deleteCmsResource,
  saveCmsStaff,
  deleteCmsStaff,
  saveCmsGalleryPhoto,
  deleteCmsGalleryPhoto,
  saveCmsMilestone,
  deleteCmsMilestone,
  saveCmsSettings,
  DEFAULT_CMS_SEED
} from '../services/cmsClient.js';

export default function CmsStudio() {
  const [cmsData, setCmsData] = useState(getLiveCmsData());
  const [activeSubTab, setActiveSubTab] = useState('programs'); // 'programs' | 'events' | 'news' | 'resources' | 'staff' | 'gallery' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'program' | 'event' | 'news' | 'resource' | 'staff' | 'gallery' | 'milestone' | null
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [cancelModalEvent, setCancelModalEvent] = useState(null);
  const [cancelNoticeText, setCancelNoticeText] = useState('');

  // Reload data
  const refreshData = () => {
    setCmsData(getLiveCmsData());
  };

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // --------------------------------------------------------------------------
  // Reset, Export & Import
  // --------------------------------------------------------------------------
  const handleResetDefaults = () => {
    resetCmsToDefault();
    refreshData();
    setShowResetModal(false);
    showToast('All CMS content successfully restored to official DCVC seed data.');
  };

  const handleExportJson = () => {
    const data = getLiveCmsData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DCVC-CMS-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CMS database export downloaded successfully.');
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure');
        saveLiveCmsData(parsed);
        refreshData();
        showToast('CMS database successfully imported and applied.');
      } catch (err) {
        alert('Failed to import CMS file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --------------------------------------------------------------------------
  // Modal Handlers
  // --------------------------------------------------------------------------
  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    if (type === 'program') {
      setFormData({
        title: '',
        tagline: '',
        slug: '',
        chapter: `0${(cmsData.programs?.length || 0) + 1}`,
        heroImage: '/images/crc-building.jpg',
        accent: '#5A1E65',
        fontSize: 'base',
        fontColor: '#5A1E65',
        audience: 'All LGBTQ+ community members and affirming allies',
        schedule: 'Monday – Friday, 1:00 PM – 5:00 PM',
        location: '2471 Portola Road, Suite 100, Ventura, CA 93003',
        summary: '',
        contactEmail: 'info@diversitycollective.org',
        contactPhone: '(805) 644-5428',
        active: true
      });
    } else if (type === 'event') {
      setFormData({
        title: '',
        slug: '',
        date: 'August 15, 2026',
        time: '11:00 AM – 7:00 PM',
        location: 'Ventura County, CA',
        category: 'Community Celebration',
        description: '',
        image: '/images/community-gathering.jpg',
        fontSize: 'base',
        fontColor: '#0F172A',
        rsvpUrl: '/events',
        isCancelled: false,
        cancellationNotice: '',
        featured: false
      });
    } else if (type === 'news') {
      setFormData({
        title: '',
        slug: '',
        category: 'Community & Advocacy',
        publishDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        author: 'Diversity Collective Team',
        readTime: '3 min read',
        image: '/images/community-gathering.jpg',
        fontSize: 'base',
        fontColor: '#0F172A',
        excerpt: '',
        tags: 'Advocacy, Community, Ventura'
      });
    } else if (type === 'resource') {
      setFormData({
        name: '',
        category: 'Health & Clinical',
        description: '',
        phone: '(805) 644-5428',
        address: '2471 Portola Road, Suite 100, Ventura, CA',
        website: 'https://www.diversitycollectivevc.org',
        verified: true,
        urgent: false
      });
    } else if (type === 'staff') {
      setFormData({
        name: '',
        title: '',
        category: 'staff',
        email: 'info@diversitycollective.org',
        bio: '',
        photo: '/images/volunteers.jpg'
      });
    } else if (type === 'gallery') {
      setFormData({
        title: '',
        category: 'Festivals & Pride',
        year: '2026',
        image: '/images/community-gathering.jpg',
        description: '',
        quote: ''
      });
    } else if (type === 'milestone') {
      setFormData({
        year: '2026',
        title: '',
        subtitle: '',
        description: '',
        stat: '100% Community-Powered',
        badge: 'Sanctuary Era',
        image: '/images/community-gathering.jpg',
        pictureFolder: [],
        fontSize: 'base',
        fontColor: '#5A1E65',
        quote: '',
        details: ''
      });
    }
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'news') {
      setFormData({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
      });
    } else if (type === 'milestone') {
      setFormData({
        ...item,
        pictureFolder: item.pictureFolder || []
      });
    } else {
      setFormData({ ...item });
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (modalType === 'program') {
      saveCmsProgram(formData);
      showToast(`Program "${formData.title}" saved.`);
    } else if (modalType === 'event') {
      saveCmsEvent(formData);
      showToast(`Event "${formData.title}" saved.`);
    } else if (modalType === 'news') {
      const formattedTags = typeof formData.tags === 'string'
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : formData.tags;
      saveCmsArticle({ ...formData, tags: formattedTags });
      showToast(`Article "${formData.title}" saved.`);
    } else if (modalType === 'resource') {
      saveCmsResource(formData);
      showToast(`Resource "${formData.name}" saved.`);
    } else if (modalType === 'staff') {
      saveCmsStaff(formData);
      showToast(`Team member "${formData.name}" saved.`);
    } else if (modalType === 'gallery') {
      saveCmsGalleryPhoto(formData);
      showToast(`Gallery photo "${formData.title}" saved.`);
    } else if (modalType === 'milestone') {
      saveCmsMilestone(formData);
      showToast(`Milestone "${formData.year}" saved.`);
    }
    refreshData();
    setModalType(null);
    setEditingItem(null);
  };

  const handleDeleteItem = (type, idOrYear) => {
    if (!window.confirm('Are you sure you want to delete this content item? This action immediately updates the public website.')) return;
    if (type === 'program') deleteCmsProgram(idOrYear);
    else if (type === 'event') deleteCmsEvent(idOrYear);
    else if (type === 'news') deleteCmsArticle(idOrYear);
    else if (type === 'resource') deleteCmsResource(idOrYear);
    else if (type === 'staff') deleteCmsStaff(idOrYear);
    else if (type === 'gallery') deleteCmsGalleryPhoto(idOrYear);
    else if (type === 'milestone') deleteCmsMilestone(idOrYear);
    refreshData();
    showToast('Content item deleted.');
  };

  const handleSaveSettingsForm = (e) => {
    e.preventDefault();
    saveCmsSettings(cmsData.settings);
    refreshData();
    showToast('Site-Wide Settings & Emergency Notice updated live.');
  };

  // Cancellation Modal Trigger
  const openCancelModal = (event) => {
    setCancelModalEvent(event);
    setCancelNoticeText(event.cancellationNotice || 'This event has been rescheduled. Please check back shortly or email info@diversitycollective.org.');
  };

  const handleConfirmCancelToggle = () => {
    if (!cancelModalEvent) return;
    toggleCmsEventCancel(cancelModalEvent.id, cancelNoticeText);
    refreshData();
    setCancelModalEvent(null);
    showToast(`Event status updated: ${cancelModalEvent.title}`);
  };

  // Sub-tab definitions
  const subTabs = [
    { id: 'programs', label: 'Programs & Clinical Care', count: cmsData.programs?.length || 0, icon: Sparkles },
    { id: 'events', label: 'Events & Calendar', count: cmsData.events?.length || 0, icon: Calendar },
    { id: 'news', label: 'News & Articles', count: cmsData.news?.length || 0, icon: FileText },
    { id: 'resources', label: 'Community Resources', count: cmsData.resources?.length || 0, icon: BookOpen },
    { id: 'staff', label: 'Board & Staff', count: cmsData.staff?.length || 0, icon: Users },
    { id: 'gallery', label: 'Gallery & Memory Lane', count: (cmsData.gallery?.length || 0) + (cmsData.memoryLane?.length || 0), icon: Camera },
    { id: 'settings', label: 'Global Site Settings', count: null, icon: Settings }
  ];

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Universal CMS Control Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-[#5A1E65] to-indigo-950 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-purple-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
              REACTIVE SITE CONTENT MANAGEMENT ENGINE
            </span>
            <span className="text-[10px] bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded-full font-mono border border-purple-700">
              Sync Active
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            DCVC Live Content Studio
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
            Full administrative control over every public page, program, event cancellation notice, community resource, staff biography, and 3D gallery spotlight. Changes sync immediately across all tabs and public visitors.
          </p>
        </div>

        {/* Global CMS Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/20"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>View Public Site</span>
            <ExternalLink className="w-3 h-3 text-purple-300" />
          </a>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-700"
            title="Download full JSON database snapshot"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-800"
            title="Restore all collections to original factory seed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery('');
              }}
              className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${isActive
                  ? 'bg-[#5A1E65] text-white border-purple-800 shadow-md shadow-purple-950/15 ring-2 ring-purple-400/30'
                  : 'bg-white text-slate-700 hover:text-slate-950 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-purple-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================================
          SUB-TAB 1: PROGRAMS & CLINICAL CARE
          ====================================================================== */}
      {activeSubTab === 'programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Core Sanctuary Programs ({cmsData.programs?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage clinical services, youth circles, pre-teen programs, and physical center hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('program')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Program</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsData.programs?.map((prog) => (
              <div
                key={prog.id || prog.slug}
                className="p-5 rounded-3xl bg-white border-2 border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-2xs"
                      style={{ backgroundColor: prog.accent || '#5A1E65' }}
                    >
                      Chapter {prog.chapter || '01'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prog.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {prog.active !== false ? '● Active' : '○ Draft'}
                    </span>
                  </div>

                  {(() => {
                    const isContain = prog.imageFit === 'contain' || 
                      prog.heroImage?.includes('crc-building') || 
                      prog.heroImage?.includes('unicorns') || 
                      prog.heroImage?.includes('logo');
                    return (
                      <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 relative flex items-center justify-center p-3">
                        {isContain && (
                          <img
                            src={prog.heroImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-125 pointer-events-none"
                          />
                        )}
                        <img
                          src={prog.heroImage}
                          alt={prog.title}
                          className={`w-full h-full ${isContain ? 'object-contain relative z-10' : 'object-cover'}`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/crc-building.jpg';
                          }}
                        />
                      </div>
                    );
                  })()}

                  <div>
                    <h4 className="font-display text-lg font-black text-slate-950 leading-tight">
                      {prog.title}
                    </h4>
                    <p className="text-xs font-semibold text-purple-700 mt-0.5 line-clamp-1">
                      {prog.tagline}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {prog.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{prog.schedule}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{prog.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`/programs/${prog.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-slate-50 text-xs font-bold flex items-center gap-1"
                    title="Preview on Live Site"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal('program', prog)}
                      className="p-2 text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Program"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('program', prog.slug || prog.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 2: EVENTS & CALENDAR (WITH CANCELLATION TOGGLE)
          ====================================================================== */}
      {activeSubTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Community Events & Festivals ({cmsData.events?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Schedule signature galas, oceanside Pride festivals, or post live cancellation/reschedule alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('event')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>

          <div className="space-y-4">
            {cmsData.events?.map((evt) => (
              <div
                key={evt.id || evt.slug}
                className={`p-6 rounded-3xl bg-white border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs ${evt.isCancelled ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200/80 hover:border-purple-300'
                  }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black text-[10px] uppercase">
                      {evt.category}
                    </span>
                    {evt.featured && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                        ★ Signature Event
                      </span>
                    )}
                    {evt.isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase animate-pulse">
                        ⚠️ Event Cancelled / Rescheduled
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-xl font-black text-slate-950">
                    {evt.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1 text-purple-700">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{evt.date}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{evt.time}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{evt.location}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {evt.description}
                  </p>

                  {evt.isCancelled && evt.cancellationNotice && (
                    <div className="p-3 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-rose-950">Public Cancellation Alert:</strong>
                        <span>{evt.cancellationNotice}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => openCancelModal(evt)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${evt.isCancelled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      }`}
                  >
                    {evt.isCancelled ? '✓ Mark as Active' : '⚠️ Post Cancellation Notice'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal('event', evt)}
                    className="p-2.5 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                    title="Edit Event"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem('event', evt.id || evt.slug)}
                    className="p-2.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 3: NEWS & ARTICLES
          ====================================================================== */}
      {activeSubTab === 'news' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                News & Stories ({cmsData.news?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish clinical updates, youth impact narratives, and policy press releases.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('news')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Write New Article</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsData.news?.map((art) => (
              <div
                key={art.id || art.slug}
                className="p-5 rounded-3xl bg-white border-2 border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 relative">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/community-gathering.jpg';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold">
                      {art.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-purple-700">
                      {art.publishDate} · {art.readTime}
                    </span>
                    <h4 className="font-display text-base font-black text-slate-950 mt-1 leading-snug line-clamp-2">
                      {art.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>

                  {art.tags && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(Array.isArray(art.tags) ? art.tags : []).map(t => (
                        <span key={t} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    By {art.author}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal('news', art)}
                      className="p-2 text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('news', art.id || art.slug)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 4: COMMUNITY RESOURCES
          ====================================================================== */}
      {activeSubTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Community Resources & Support Lifelines ({cmsData.resources?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Curate verified crisis hotlines, family support groups, and clinical partner directories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('resource')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="space-y-3">
            {cmsData.resources?.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black text-[10px] uppercase">
                      {res.category}
                    </span>
                    {res.urgent && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-black text-[10px] animate-pulse">
                        🚨 24/7 Crisis Hotline
                      </span>
                    )}
                    {res.verified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ Verified Partner
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-base font-black text-slate-950">
                    {res.name}
                  </h4>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    {res.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-purple-700">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{res.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.address}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal('resource', res)}
                    className="p-2 text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit Resource"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('resource', res.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 5: BOARD & STAFF ROSTER
          ====================================================================== */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Staff & Board Leadership Directory ({cmsData.staff?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage executive leadership, program coordinators, and board of directors profiles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('staff')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cmsData.staff?.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 relative">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/volunteers.jpg';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase">
                      {member.category === 'board' ? 'Board of Directors' : 'Operational Staff'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display text-base font-black text-slate-950">
                      {member.name}
                    </h4>
                    <p className="text-xs font-bold text-purple-700 mt-0.5">
                      {member.title}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                    {member.email}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal('staff', member)}
                      className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Member"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('staff', member.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 6: GALLERY SPOTLIGHTS & MEMORY LANE
          ====================================================================== */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-10">

          {/* SECTION A: 3D SPOTLIGHT CARDS */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-950 flex items-center gap-2">
                  <span>3D Carousel Spotlights</span>
                  <span className="text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                    {cmsData.gallery?.length || 0}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Featured photographs showcased in the interactive 3D perspective carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal('gallery')}
                className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Carousel Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cmsData.gallery?.map((photo) => (
                <div
                  key={photo.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 relative">
                      <img 
                        src={photo.image} 
                        alt={photo.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/community-gathering.jpg';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-bold">
                        {photo.year}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-black text-slate-950 line-clamp-1">
                      {photo.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {photo.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700">
                      {photo.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal('gallery', photo)}
                        className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem('gallery', photo.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: MEMORY LANE HISTORICAL MILESTONES */}
          <div className="space-y-6 pt-6 border-t-2 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-950 flex items-center gap-2">
                  <span>Historical Memory Lane Milestones (2014 – 2026)</span>
                  <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    {cmsData.memoryLane?.length || 0} Chapters
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological chapters displayed on the Gallery Memory Lane timeline path.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal('milestone')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Historical Milestone</span>
              </button>
            </div>

            <div className="space-y-3">
              {cmsData.memoryLane?.map((m) => (
                <div
                  key={m.year}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-24 h-18 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                      <img
                        src={m.image || '/images/community-gathering.jpg'}
                        alt={m.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/community-gathering.jpg';
                        }}
                      />
                      {m.pictureFolder && m.pictureFolder.length > 0 && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-amber-300 flex items-center gap-0.5">
                          <FolderOpen className="w-2.5 h-2.5" />
                          <span>+{m.pictureFolder.length}</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-black text-purple-900">
                          {m.year}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                          {m.badge}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {m.stat}
                        </span>
                        {m.pictureFolder && m.pictureFolder.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 flex items-center gap-1">
                            <FolderOpen className="w-3 h-3 text-purple-600" />
                            <span>{m.pictureFolder.length} Album Photos</span>
                          </span>
                        )}
                      </div>
                      <h4 
                        style={{ color: m.fontColor || undefined }}
                        className="font-display text-base font-black text-slate-950"
                      >
                        {m.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500">
                        {m.subtitle}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl pt-1">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => openEditModal('milestone', m)}
                      className="p-2 text-purple-700 hover:bg-purple-50 rounded-xl cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('milestone', m.year)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================================
          SUB-TAB 7: SITE-WIDE SETTINGS & CRISIS ALERT BAR
          ====================================================================== */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettingsForm} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Organization Information & Operating Hours
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official contact coordinates, address, and physical clinic operating schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Legal Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={cmsData.settings?.name || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, name: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Hero Headline Tagline
                </label>
                <input
                  type="text"
                  required
                  value={cmsData.settings?.tagline || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, tagline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Helpline Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={cmsData.settings?.phone || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, phone: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={cmsData.settings?.email || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, email: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Physical Sanctuary Address
                </label>
                <input
                  type="text"
                  required
                  value={cmsData.settings?.address || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, address: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Clinic Hours of Operation
                </label>
                <input
                  type="text"
                  required
                  value={cmsData.settings?.hours || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, hours: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Mission Statement
                </label>
                <textarea
                  rows={2}
                  value={cmsData.settings?.mission || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, mission: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Banner Alert Ticker Settings */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-950 flex items-center gap-2">
                  <span>Emergency Crisis Hotline & Announcement Ticker</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Universal Header
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displayed at the very top of all pages above navigation.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cmsData.settings?.bannerAlertActive !== false}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, bannerAlertActive: e.target.checked }
                  })}
                  className="w-4 h-4 accent-[#5A1E65] rounded"
                />
                <span className="text-xs font-bold text-slate-700">Display Top Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Top Announcement Ticker Text
                </label>
                <input
                  type="text"
                  value={cmsData.settings?.bannerAlertText || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, bannerAlertText: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  24/7 Crisis Hotline Notice (e.g. 988 lifeline)
                </label>
                <input
                  type="text"
                  value={cmsData.settings?.emergencyCrisisNotice || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    settings: { ...cmsData.settings, emergencyCrisisNotice: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Save All Site Settings
            </button>
          </div>
        </form>
      )}

      {/* ======================================================================
          CREATE / EDIT CONTENT MODAL
          ====================================================================== */}
      {modalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200 flex flex-col max-h-[90vh]">

            <div className="p-5 bg-gradient-to-r from-purple-950 via-[#5A1E65] to-indigo-950 text-white flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {editingItem ? `Edit ${modalType}` : `Create New ${modalType}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4 flex-1">

              {/* Program Form Fields */}
              {modalType === 'program' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                      <input
                        type="text"
                        required
                        value={formData.tagline || ''}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chapter</label>
                      <input
                        type="text"
                        value={formData.chapter || '01'}
                        onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Accent Hex</label>
                      <input
                        type="text"
                        value={formData.accent || '#5A1E65'}
                        onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <ImagePicker
                    value={formData.heroImage}
                    onChange={(url) => setFormData({ ...formData, heroImage: url })}
                    label="Program Header / Sanctuary Picture"
                    aspectRatio="aspect-[16/9]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Image Framing & Fit</label>
                      <select
                        value={formData.imageFit || 'cover'}
                        onChange={(e) => setFormData({ ...formData, imageFit: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-[#5A1E65]"
                      >
                        <option value="cover">Fill Card (Cover / Photo)</option>
                        <option value="contain">Fit Whole Image (Contain / No Crop - Best for Logos & Graphics)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Cropping Protection</label>
                      <p className="text-[11px] text-slate-600 leading-tight pt-1">
                        {formData.imageFit === 'contain' 
                          ? '✓ 100% of circular badges and logos are preserved with zero edge clipping.' 
                          : 'Standard full-bleed cover frame. Use Adjust & Crop above if logos clip.'}
                      </p>
                    </div>
                  </div>

                  <StyleCustomizer
                    fontSize={formData.fontSize || 'base'}
                    fontColor={formData.fontColor || '#5A1E65'}
                    onFontSizeChange={(size) => setFormData({ ...formData, fontSize: size })}
                    onFontColorChange={(color) => setFormData({ ...formData, fontColor: color })}
                    label="Title & Header Typography"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Audience</label>
                    <input
                      type="text"
                      value={formData.audience || ''}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Schedule</label>
                      <input
                        type="text"
                        value={formData.schedule || ''}
                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Summary Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.summary || ''}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Event Form Fields */}
              {modalType === 'event' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                      <input
                        type="text"
                        required
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                      <input
                        type="text"
                        required
                        value={formData.time || ''}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      required
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <ImagePicker
                    value={formData.image || '/images/community-gathering.jpg'}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    label="Event Cover Picture"
                    aspectRatio="aspect-[16/9]"
                  />

                  <StyleCustomizer
                    fontSize={formData.fontSize || 'base'}
                    fontColor={formData.fontColor || '#0F172A'}
                    onFontSizeChange={(size) => setFormData({ ...formData, fontSize: size })}
                    onFontColorChange={(color) => setFormData({ ...formData, fontColor: color })}
                    label="Event Title Typography"
                  />

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured || false}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="accent-[#5A1E65]"
                      />
                      <span className="text-xs font-bold text-slate-700">Signature Event</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCancelled || false}
                        onChange={(e) => setFormData({ ...formData, isCancelled: e.target.checked })}
                        className="accent-rose-600"
                      />
                      <span className="text-xs font-bold text-rose-700">Mark Cancelled</span>
                    </label>
                  </div>
                </>
              )}

              {/* News / Article Form Fields */}
              {modalType === 'news' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Article Headline</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Author</label>
                      <input
                        type="text"
                        required
                        value={formData.author || ''}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Read Time</label>
                      <input
                        type="text"
                        value={formData.readTime || '3 min read'}
                        onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <ImagePicker
                    value={formData.image || '/images/community-gathering.jpg'}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    label="Article Feature Picture"
                    aspectRatio="aspect-[16/9]"
                  />

                  <StyleCustomizer
                    fontSize={formData.fontSize || 'base'}
                    fontColor={formData.fontColor || '#0F172A'}
                    onFontSizeChange={(size) => setFormData({ ...formData, fontSize: size })}
                    onFontColorChange={(color) => setFormData({ ...formData, fontColor: color })}
                    label="Article Headline Typography"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Excerpt</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags || ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Article Full Body & Layout (Blogspot Writing Pad)</span>
                      <span className="text-[10px] text-purple-700 font-semibold">Supports Rich Text, Images, Callouts & HTML</span>
                    </label>
                    <NewsWritingPad
                      value={formData.body || formData.content || ''}
                      onChange={(html) => setFormData(prev => ({ ...prev, body: html }))}
                      onReadTimeCalculated={(time) => setFormData(prev => ({ ...prev, readTime: time }))}
                    />
                  </div>
                </>
              )}

              {/* Resource Form Fields */}
              {modalType === 'resource' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Resource Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Address / Coverage</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.verified !== false}
                        onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                        className="accent-emerald-600"
                      />
                      <span className="text-xs font-bold text-slate-700">Verified Organization</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.urgent || false}
                        onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                        className="accent-rose-600"
                      />
                      <span className="text-xs font-bold text-rose-700">Urgent 24/7 Lifeline</span>
                    </label>
                  </div>
                </>
              )}

              {/* Staff Form Fields */}
              {modalType === 'staff' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Role / Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={formData.category || 'staff'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      >
                        <option value="staff">Operational Staff</option>
                        <option value="board">Board of Directors</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <ImagePicker
                    value={formData.photo || '/images/volunteers.jpg'}
                    onChange={(url) => setFormData({ ...formData, photo: url })}
                    label="Staff / Board Member Portrait"
                    aspectRatio="aspect-[4/3]"
                    helpText="Upload a professional headshot or portrait photo."
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Biography</label>
                    <textarea
                      rows={3}
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Gallery Photo Form Fields */}
              {modalType === 'gallery' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Photo Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || 'Festivals & Pride'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                      <input
                        type="text"
                        required
                        value={formData.year || '2026'}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <ImagePicker
                    value={formData.image || '/images/community-gathering.jpg'}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    label="3D Carousel Spotlight Picture"
                    aspectRatio="aspect-[16/9]"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Inspiring Archival Quote</label>
                    <input
                      type="text"
                      value={formData.quote || ''}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs italic"
                    />
                  </div>
                </>
              )}

              {/* Memory Lane Milestone Form Fields */}
              {modalType === 'milestone' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                      <input
                        type="text"
                        required
                        value={formData.year || '2026'}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={formData.badge || 'Sanctuary Era'}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Key Stat</label>
                      <input
                        type="text"
                        value={formData.stat || '10 Cities United'}
                        onChange={(e) => setFormData({ ...formData, stat: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Milestone Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <ImagePicker
                    value={formData.image || '/images/community-gathering.jpg'}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    label="Featured Milestone Picture"
                    aspectRatio="aspect-[16/9]"
                  />

                  <PictureFolderManager
                    photos={formData.pictureFolder || []}
                    onChange={(newFolder) => setFormData({ ...formData, pictureFolder: newFolder })}
                  />

                  <StyleCustomizer
                    fontSize={formData.fontSize || 'base'}
                    fontColor={formData.fontColor || '#5A1E65'}
                    onFontSizeChange={(size) => setFormData({ ...formData, fontSize: size })}
                    onFontColorChange={(color) => setFormData({ ...formData, fontColor: color })}
                    label="Milestone Title Typography"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Narrative Description</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Save & Publish Live
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          CANCELLATION NOTICE MODAL
          ====================================================================== */}
      {cancelModalEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-rose-300 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display text-lg font-black text-slate-950">
                {cancelModalEvent.isCancelled ? 'Resume Event Publication?' : 'Post Event Cancellation / Reschedule Notice?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Event: <strong>{cancelModalEvent.title}</strong>
              </p>
            </div>

            {!cancelModalEvent.isCancelled && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Public Notice Message
                </label>
                <textarea
                  rows={3}
                  value={cancelNoticeText}
                  onChange={(e) => setCancelNoticeText(e.target.value)}
                  placeholder="e.g. This event has been rescheduled due to severe weather. All tickets remain valid for November 14."
                  className="w-full p-3 border rounded-xl text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelToggle}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs ${cancelModalEvent.isCancelled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                {cancelModalEvent.isCancelled ? 'Confirm: Mark Event Active' : 'Confirm: Post Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          RESET TO FACTORY CONFIRMATION MODAL
          ====================================================================== */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border-2 border-rose-400 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display text-lg font-black text-slate-950">
                Restore Official DCVC Seed Content?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This will reset all Programs, Events, News articles, Community Resources, Staff entries, and Gallery photos back to the original verified DCVC seed database. Any custom items you added without exporting will be replaced.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Keep Current Data
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Confirm Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

