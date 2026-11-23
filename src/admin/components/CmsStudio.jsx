import React, { useState, useEffect, useMemo } from 'react';
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
  FolderOpen,
  Palette,
  Mic,
  Radio
} from 'lucide-react';
import ImagePicker from './ImagePicker.jsx';
import MultiImagePicker from './MultiImagePicker.jsx';
import AutoSlideImage from '../../components/AutoSlideImage.jsx';
import PictureFolderManager from './PictureFolderManager.jsx';
import StyleCustomizer from './StyleCustomizer.jsx';
import NewsWritingPad from './NewsWritingPad.jsx';
import CardGradientStudio from './CardGradientStudio.jsx';
import SponsorshipManager from './SponsorshipManager.jsx';
import WeeklyScheduleManager from './WeeklyScheduleManager.jsx';
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
  saveCmsSponsor,
  deleteCmsSponsor,
  saveCmsTraining,
  deleteCmsTraining,
  getCmsTrainingPageContent,
  saveCmsTrainingPageContent,
  saveCmsPodcast,
  deleteCmsPodcast,
  saveCmsSettings,
  DEFAULT_CMS_SEED
} from '../services/cmsClient.js';
import { getStoredUser } from '../services/adminClient.js';
import { parseEventDate, normalizeCmsEvent } from '../../utils/eventDates.js';
import { SYNC_EVENTS } from '../../services/liveSync.js';
import { cmsStore } from '../../services/cmsStore.js';

export default function CmsStudio() {
  const [cmsData, setCmsData] = useState(getLiveCmsData());
  const [activeSubTab, setActiveSubTab] = useState('programs'); // 'programs' | 'events' | 'news' | 'resources' | 'staff' | 'gallery' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [hoursValidationError, setHoursValidationError] = useState('');
  const currentUser = getStoredUser();
  const isAuthorizedAdmin = !currentUser || !currentUser.role || currentUser.role === 'admin';

  // Modals state
  const [modalType, setModalType] = useState(null); // 'program' | 'event' | 'news' | 'resource' | 'staff' | 'gallery' | 'milestone' | null
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [cancelModalEvent, setCancelModalEvent] = useState(null);
  const [cancelNoticeText, setCancelNoticeText] = useState('');
  const [showImportEventsModal, setShowImportEventsModal] = useState(false);
  const [importEventsRawText, setImportEventsRawText] = useState('');
  const [importEventsMode, setImportEventsMode] = useState('file'); // 'file' | 'paste'
  const [importEventsMergeMode, setImportEventsMergeMode] = useState('append'); // 'append' | 'replace'
  const [importEventsParsed, setImportEventsParsed] = useState([]);
  const [importEventsError, setImportEventsError] = useState('');
  const [trainingViewMode, setTrainingViewMode] = useState('courses'); // 'courses' | 'pageContent'
  const [trainingPageData, setTrainingPageData] = useState(() => getCmsTrainingPageContent());
  const [staffFilter, setStaffFilter] = useState('all'); // 'all' | 'board' | 'staff'

  const boardList = useMemo(() => {
    return cmsStore.getBoardMembers();
  }, [cmsData]);

  const operationalStaffList = useMemo(() => {
    return cmsStore.getStaffMembers();
  }, [cmsData]);

  // Reload data
  const refreshData = () => {
    setCmsData({ ...getLiveCmsData() });
    setTrainingPageData(getCmsTrainingPageContent());
  };

  useEffect(() => {
    const onCmsUpdate = () => {
      setCmsData({ ...getLiveCmsData() });
      setTrainingPageData(getCmsTrainingPageContent());
    };
    const onSubTabNav = (e) => {
      if (e?.detail?.subTab) setActiveSubTab(e.detail.subTab);
    };
    const onCreatePodcast = (e) => {
      setActiveSubTab('podcasts');
      openCreateModal('podcast');
      if (e?.detail) {
        setFormData(prev => ({
          ...prev,
          title: e.detail.title || prev.title,
          category: e.detail.category || prev.category,
          guests: e.detail.guests || prev.guests,
          link: e.detail.link || prev.link,
          summary: e.detail.description || prev.summary,
          description: e.detail.description || prev.description
        }));
      }
    };
    window.addEventListener(SYNC_EVENTS.CMS_CHANGED, onCmsUpdate);
    window.addEventListener('dcvc-admin-cms-subtab', onSubTabNav);
    window.addEventListener('dcvc-admin-create-podcast', onCreatePodcast);
    return () => {
      window.removeEventListener(SYNC_EVENTS.CMS_CHANGED, onCmsUpdate);
      window.removeEventListener('dcvc-admin-cms-subtab', onSubTabNav);
      window.removeEventListener('dcvc-admin-create-podcast', onCreatePodcast);
    };
  }, []);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // --------------------------------------------------------------------------
  // Reset, Export & Import
  // --------------------------------------------------------------------------
  const downloadSampleEventsCsv = () => {
    const csvSample = `title,date,time,location,address,category,description,rsvpUrl,contactEmail,featured
"Oceanside Pride Sunset Gala","August 15, 2026","5:00 PM – 9:00 PM","Ventura Promenade","Ventura Beach Boardwalk, Ventura, CA","Community Celebration","Annual sunset gala celebrating community resilience and LGBTQ+ pride.","https://diversitycollectivevc.org/events","events@diversitycollective.org",true
"Youth Creative Arts & Open Mic","September 12, 2026","4:00 PM – 6:30 PM","Community Resource Center","2471 Portola Road, Suite 100, Ventura, CA","Youth","An affirming creative space for LGBTQ+ youth and allies to share poetry, art, and music.","/events","youth@diversitycollective.org",false
"Trans & Nonbinary Wellness Circle","October 10, 2026","6:00 PM – 7:30 PM","Community Resource Center","2471 Portola Road, Suite 100, Ventura, CA","Health & Wellness","Monthly peer support, wellbeing resources, and guided discussion for trans and nonbinary community members.","/events","info@diversitycollective.org",false`;

    const blob = new Blob([csvSample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dcvc_events_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseImportedEventsText = (rawText) => {
    if (!rawText || !rawText.trim()) return [];
    const trimmed = rawText.trim();

    // JSON format
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (parsed.events || [parsed]);
        return list.map(evt => formatImportedEvent(evt)).filter(Boolean);
      } catch (err) {
        throw new Error('Invalid JSON format: ' + err.message);
      }
    }

    // CSV format parsing with quotes and multiline support
    const lines = [];
    let curLine = [];
    let curVal = '';
    let insideQuote = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      const next = trimmed[i + 1];

      if (char === '"') {
        if (insideQuote && next === '"') {
          curVal += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        curLine.push(curVal.trim());
        curVal = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && next === '\n') i++;
        curLine.push(curVal.trim());
        if (curLine.some(c => c.length > 0)) lines.push(curLine);
        curLine = [];
        curVal = '';
      } else {
        curVal += char;
      }
    }
    if (curVal.length > 0 || curLine.length > 0) {
      curLine.push(curVal.trim());
      if (curLine.some(c => c.length > 0)) lines.push(curLine);
    }

    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one event row.');
    }

    const rawHeaders = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
      if (h.includes('title') || h.includes('name') || h.includes('event')) headerMap.title = idx;
      else if (h.includes('date') || h.includes('day')) headerMap.date = idx;
      else if (h.includes('time') || h.includes('hour')) headerMap.time = idx;
      else if (h.includes('address')) headerMap.address = idx;
      else if (h.includes('loc') || h.includes('venue')) headerMap.location = idx;
      else if (h.includes('cat') || h.includes('type')) headerMap.category = idx;
      else if (h.includes('desc') || h.includes('detail') || h.includes('about')) headerMap.description = idx;
      else if (h.includes('rsvp') || h.includes('link') || h.includes('reg') || h.includes('url')) headerMap.rsvpUrl = idx;
      else if (h.includes('email') || h.includes('contact')) headerMap.contactEmail = idx;
      else if (h.includes('feat') || h.includes('highlight')) headerMap.featured = idx;
    });

    const events = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const getCol = (key) => headerMap[key] !== undefined ? row[headerMap[key]] : '';
      
      const title = getCol('title') || row[0];
      if (!title) continue;

      const date = getCol('date') || 'August 15, 2026';
      const time = getCol('time') || '11:00 AM – 7:00 PM';
      const location = getCol('location') || 'Community Resource Center';
      const address = getCol('address') || (location.includes('Portola') ? location : '2471 Portola Road, Suite 100, Ventura, CA');
      const category = getCol('category') || 'Community Celebration';
      const description = getCol('description') || 'Join us for this community gathering.';
      const rsvpUrl = getCol('rsvpUrl') || '/events';
      const contactEmail = getCol('contactEmail') || 'info@diversitycollective.org';
      const featuredRaw = String(getCol('featured')).toLowerCase();
      const featured = featuredRaw === 'true' || featuredRaw === '1' || featuredRaw === 'yes';

      events.push(formatImportedEvent({
        title,
        date,
        time,
        location,
        address,
        category,
        description,
        rsvpUrl,
        contactEmail,
        featured
      }));
    }

    return events;
  };

  const formatImportedEvent = (raw) => {
    const slug = (raw.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = raw.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    return {
      id,
      slug,
      title: raw.title || 'Community Event',
      date: raw.date || raw.displayDate || 'August 15, 2026',
      isoDate: raw.isoDate || (raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : '2026-08-15'),
      time: raw.time || '11:00 AM – 7:00 PM',
      location: raw.location || 'Community Resource Center',
      address: raw.address || '2471 Portola Road, Suite 100, Ventura, CA',
      category: raw.category || 'Community Celebration',
      description: raw.description || '',
      image: '/images/community-gathering.jpg', // Images can be added by editing event
      rsvpUrl: raw.rsvpUrl || raw.registrationUrl || '/events',
      contactEmail: raw.contactEmail || 'info@diversitycollective.org',
      featured: Boolean(raw.featured),
      isCancelled: false,
      cancellationNotice: ''
    };
  };

  const handleEventsFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportEventsError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setImportEventsRawText(text);
        const parsed = parseImportedEventsText(text);
        setImportEventsParsed(parsed);
      } catch (err) {
        setImportEventsError(err.message);
        setImportEventsParsed([]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleEventsRawTextChange = (text) => {
    setImportEventsRawText(text);
    setImportEventsError('');
    if (!text.trim()) {
      setImportEventsParsed([]);
      return;
    }
    try {
      const parsed = parseImportedEventsText(text);
      setImportEventsParsed(parsed);
    } catch (err) {
      setImportEventsError(err.message);
      setImportEventsParsed([]);
    }
  };

  const handleExecuteEventsImport = () => {
    if (!importEventsParsed.length) return;

    const existing = cmsData.events || [];
    let merged;
    if (importEventsMergeMode === 'replace') {
      merged = importEventsParsed;
    } else {
      const existingSlugs = new Set(existing.map(e => e.slug || e.id));
      const newOnly = importEventsParsed.filter(e => !existingSlugs.has(e.slug));
      merged = [...existing, ...newOnly];
    }

    saveLiveCmsData({ events: merged });
    refreshData();
    setShowImportEventsModal(false);
    showToast(`Successfully imported ${importEventsParsed.length} event(s) into calendar.`);
    setImportEventsParsed([]);
    setImportEventsRawText('');
    setImportEventsError('');
  };

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
  const openCreateModal = (type, overrides = {}) => {
    setModalType(type);
    setEditingItem(null);
    if (type === 'program') {
      const progCount = (cmsData.programs?.length || 0) + 1;
      const chapterStr = progCount < 10 ? `0${progCount}` : `${progCount}`;
      setFormData({
        id: `prog-${Date.now()}`,
        title: '',
        tagline: '',
        slug: '',
        chapter: chapterStr,
        heroImage: '/images/crc-building.jpg',
        images: ['/images/crc-building.jpg'],
        imageFit: 'contain',
        accent: '#5A1E65',
        fontSize: 'base',
        fontColor: '#5A1E65',
        audience: 'All LGBTQ+ community members and affirming allies',
        audienceColor: '#7E22CE',
        schedule: 'Monday – Friday, 1:00 PM – 5:00 PM',
        location: '2471 Portola Road, Suite 100, Ventura, CA 93003',
        summary: '',
        description: '',
        amenities: [],
        contactEmail: 'info@diversitycollective.org',
        contactPhone: '(805) 644-5428',
        active: true,
        ...overrides
      });
    } else if (type === 'event') {
      setFormData({
        title: '',
        slug: '',
        isoDate: '2026-08-15',
        date: 'August 15, 2026',
        time: '11:00 AM – 7:00 PM',
        location: 'Ventura County, CA',
        category: 'Community Celebration',
        description: '',
        image: '/images/community-gathering.jpg',
        images: ['/images/community-gathering.jpg'],
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
        images: ['/images/community-gathering.jpg'],
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
      const cat = overrides.category || 'staff';
      setFormData({
        id: overrides.id || `${cat}-${Date.now()}`,
        name: '',
        pronouns: '',
        title: cat === 'board' ? 'Board Member' : 'Staff Member',
        role: cat === 'board' ? 'Board Member' : 'Staff Member',
        category: cat,
        email: 'info@diversitycollective.org',
        bio: '',
        photo: '',
        image: '',
        ...overrides
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
        badge: 'Center Era',
        image: '/images/community-gathering.jpg',
        pictureFolder: [],
        fontSize: 'base',
        fontColor: '#5A1E65',
        quote: '',
        details: ''
      });
    } else if (type === 'sponsor') {
      setFormData({
        name: '',
        shortName: '',
        role: 'Community Health & Center Partner',
        url: 'https://diversitycollectivevc.org',
        logo: '/images/vcph-logo.png'
      });
    } else if (type === 'training') {
      setFormData({
        title: '',
        slug: '',
        badge: 'Cultural Competency Workshop',
        sector: 'business',
        isBusinessAccreditation: false,
        isFlagship: false,
        duration: '2.5 Hours',
        format: 'In-Person or Interactive Virtual',
        targetAudience: 'Storefront Retail, Hospitality & Service Providers',
        summary: '',
        feeStructure: 'Sliding scale for local small businesses; custom quote for corporate teams',
        contactEmail: 'training@diversitycollective.org',
        learningObjectives: ['Understand LGBTQ+ affirming practices, frontline customer dignity, and California SB 396 non-discrimination.'],
        materials: ['Official Storefront Vinyl Window Cling', 'Framed Certificate of Excellence', 'Frontline Ally & Pronoun Pins']
      });
    } else if (type === 'podcast') {
      setFormData({
        title: '',
        slug: '',
        episodeNumber: (cmsData.podcasts?.length || 0) + 1,
        season: 1,
        category: 'Community Stories',
        host: 'DCVC Team',
        guests: '',
        duration: '30 min',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        link: '',
        audioUrl: '',
        coverImage: '/images/community-gathering.jpg',
        summary: '',
        description: '',
        featured: false
      });
    }
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'podcast') {
      setFormData({
        ...item
      });
    } else if (type === 'news') {
      const newsImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.image ? [item.image] : ['/images/community-gathering.jpg']);
      setFormData({
        ...item,
        images: newsImages,
        image: item.image || newsImages[0],
        originalId: item.id || item.slug,
        originalSlug: item.slug,
        body: item.body || item.content || '',
        content: item.content || item.body || '',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
      });
    } else if (type === 'milestone') {
      setFormData({
        ...item,
        pictureFolder: item.pictureFolder || []
      });
    } else if (type === 'event') {
      const parsed = parseEventDate(item);
      const eventImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.image ? [item.image] : ['/images/community-gathering.jpg']);
      setFormData({
        ...item,
        images: eventImages,
        image: item.image || eventImages[0],
        isoDate: parsed?.isoDate || item.isoDate || '',
        date: item.date || parsed?.displayDate || ''
      });
    } else if (type === 'program') {
      const progImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.heroImage ? [item.heroImage] : ['/images/crc-building.jpg']);
      setFormData({
        ...item,
        images: progImages,
        heroImage: item.heroImage || progImages[0],
        originalId: item.id || item.slug,
        originalSlug: item.slug
      });
    } else if (type === 'staff') {
      const portrait = item.photo || item.image || '';
      setFormData({
        ...item,
        originalId: item.id || item.slug || item.name,
        originalName: item.name || '',
        originalSlug: item.slug || '',
        pronouns: item.pronouns || '',
        title: item.title || item.role || (item.category === 'board' ? 'Board Member' : 'Staff Member'),
        role: item.role || item.title || (item.category === 'board' ? 'Board Member' : 'Staff Member'),
        category: item.category || 'staff',
        photo: portrait,
        image: portrait
      });
    } else if (type === 'training') {
      setFormData({
        ...item,
        materials: Array.isArray(item.materials) ? item.materials : [],
        learningObjectives: Array.isArray(item.learningObjectives) ? item.learningObjectives : []
      });
    } else {
      setFormData({ ...item });
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (modalType === 'program') {
      const cleanTitle = (formData.title || '').trim();
      const fallbackSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const progSlug = (formData.slug || '').trim() || fallbackSlug || `program-${Date.now()}`;
      const heroImg = formData.images?.[0] || formData.heroImage || '/images/crc-building.jpg';
      const payload = {
        ...formData,
        heroImage: heroImg,
        images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : [heroImg],
        slug: progSlug,
        originalId: editingItem?.id || editingItem?.slug,
        originalSlug: editingItem?.slug
      };
      saveCmsProgram(payload);
      showToast(`Program "${formData.title}" published live.`);
    } else if (modalType === 'event') {
      const eventImg = formData.images?.[0] || formData.image || '/images/community-gathering.jpg';
      const eventPayload = {
        ...formData,
        image: eventImg,
        images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : [eventImg]
      };
      const normalizedEvent = normalizeCmsEvent(eventPayload);
      saveCmsEvent(normalizedEvent);
      showToast(`Event "${normalizedEvent.title}" saved & synced to website Calendar.`);
    } else if (modalType === 'news') {
      const formattedTags = typeof formData.tags === 'string'
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : formData.tags;
      const articleImg = formData.images?.[0] || formData.image || '/images/community-gathering.jpg';
      saveCmsArticle({
        ...formData,
        image: articleImg,
        images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : [articleImg],
        originalId: editingItem?.id || editingItem?.slug,
        originalSlug: editingItem?.slug,
        tags: formattedTags
      });
      showToast(`Article "${formData.title}" saved.`);
    } else if (modalType === 'resource') {
      saveCmsResource(formData);
      showToast(`Resource "${formData.name}" saved.`);
    } else if (modalType === 'staff') {
      const effectivePhoto = formData.photo || formData.image || '';
      saveCmsStaff({
        ...formData,
        originalId: editingItem?.id || formData.originalId,
        originalName: editingItem?.name || formData.originalName,
        originalSlug: editingItem?.slug || formData.originalSlug,
        pronouns: (formData.pronouns || '').trim(),
        photo: effectivePhoto,
        image: effectivePhoto,
        title: formData.title || formData.role || (formData.category === 'board' ? 'Board Member' : 'Team Member'),
        role: formData.role || formData.title || (formData.category === 'board' ? 'Board Member' : 'Team Member')
      });
      showToast(`${formData.category === 'board' ? 'Board Member' : 'Staff Member'} "${formData.name}" saved & synced.`);
    } else if (modalType === 'gallery') {
      saveCmsGalleryPhoto(formData);
      showToast(`Gallery photo "${formData.title}" saved.`);
    } else if (modalType === 'milestone') {
      saveCmsMilestone(formData);
      showToast(`Milestone "${formData.year}" saved.`);
    } else if (modalType === 'sponsor') {
      saveCmsSponsor(formData);
      showToast(`Sponsor "${formData.name}" published live.`);
    } else if (modalType === 'training') {
      const normalizedObjectives = Array.isArray(formData.learningObjectives)
        ? formData.learningObjectives
        : String(formData.learningObjectives || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const normalizedMaterials = Array.isArray(formData.materials)
        ? formData.materials
        : String(formData.materials || '').split('\n').map((s) => s.trim()).filter(Boolean);
      saveCmsTraining({
        ...formData,
        learningObjectives: normalizedObjectives,
        materials: normalizedMaterials
      });
      showToast(`Training "${formData.title}" published live.`);
    } else if (modalType === 'podcast') {
      saveCmsPodcast(formData);
      showToast(`Podcast episode "${formData.title}" saved.`);
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
    else if (type === 'sponsor') deleteCmsSponsor(idOrYear);
    else if (type === 'training') deleteCmsTraining(idOrYear);
    else if (type === 'podcast') deleteCmsPodcast(idOrYear);
    refreshData();
    showToast('Content item deleted & synced live.');
  };

  const handleSaveSettingsForm = (e) => {
    e.preventDefault();
    if (!isAuthorizedAdmin) {
      showToast('Unauthorized: Only administrators with the Admin role can update operating hours and site settings.', 'error');
      return;
    }
    const rawHours = cmsData.settings?.hours?.trim();
    if (!rawHours || rawHours.length < 4) {
      setHoursValidationError('Operating hours cannot be blank. Please enter operating hours or specify closed days.');
      showToast('Validation failed: Please specify valid operating hours.', 'error');
      return;
    }
    setHoursValidationError('');
    try {
      saveCmsSettings(cmsData.settings);
      refreshData();
      showToast('Site-Wide Settings & CRC Operating Hours updated live.');
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'error');
    }
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
    { id: 'weeklySchedule', label: 'Weekly Schedule', count: cmsData.weeklySchedule?.length ?? 0, icon: Clock },
    { id: 'trainings', label: 'P.R.I.D.E. Trainings', count: cmsData.trainings?.length ?? 0, icon: Award },
    { id: 'sponsors', label: 'Sponsors & Partners', count: cmsData.sponsors?.length ?? 0, icon: Heart },
    { id: 'sponsorshipDocs', label: 'Sponsorship Documents', count: cmsData.sponsorshipDocuments?.length ?? 0, icon: FileText },
    { id: 'podcasts', label: 'Podcasts & Media', count: cmsData.podcasts?.length ?? 0, icon: Mic },
    { id: 'news', label: 'News & Articles', count: cmsData.news?.length ?? 0, icon: FileText },
    { id: 'resources', label: 'Community Resources', count: cmsData.resources?.length ?? 0, icon: BookOpen },
    { id: 'cardThemes', label: 'Card Gradients & Themes', count: null, icon: Palette },
    { id: 'board', label: 'Board of Directors', count: boardList.length, icon: Award },
    { id: 'staff', label: 'Operational Staff', count: operationalStaffList.length, icon: Users },
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
                Core Center Programs ({cmsData.programs?.length || 0})
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

                  <AutoSlideImage
                    images={Array.isArray(prog.images) && prog.images.length > 0 ? prog.images : [prog.heroImage || '/images/crc-building.jpg']}
                    alt={prog.title}
                    aspectRatio="aspect-[16/9]"
                    className="rounded-2xl shadow-xs"
                    imageFit={prog.imageFit || 'cover'}
                    fallbackSrc="/images/crc-building.jpg"
                  />

                  <div>
                    {prog.audience && (
                      <span
                        className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 shadow-2xs truncate max-w-full"
                        style={{
                          color: prog.audienceColor || prog.accent || '#7E22CE',
                          backgroundColor: `${prog.audienceColor || prog.accent || '#7E22CE'}15`,
                          borderColor: `${prog.audienceColor || prog.accent || '#7E22CE'}35`
                        }}
                      >
                        {prog.audience}
                      </span>
                    )}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportEventsModal(true);
                  setImportEventsParsed([]);
                  setImportEventsRawText('');
                  setImportEventsError('');
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#5A1E65] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Import events from CSV or JSON"
              >
                <Upload className="w-4 h-4" />
                <span>Import Events</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('event')}
                className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            </div>
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
          SUB-TAB: WEEKLY RECURRING SCHEDULE
          ====================================================================== */}
      {activeSubTab === 'weeklySchedule' && (
        <WeeklyScheduleManager onToast={showToast} />
      )}

      {/* ======================================================================
          SUB-TAB: PODCASTS & MEDIA
          ====================================================================== */}
      {activeSubTab === 'podcasts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Podcasts & Community Media ({cmsData.podcasts?.length || 0})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Create podcast episodes and paste streaming links (YouTube, Spotify, Apple Podcasts, audio URLs).
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('podcast')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Podcast Episode</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cmsData.podcasts || []).map((pod) => (
              <div
                key={pod.id || pod.slug}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-900">
                    <img
                      src={pod.coverImage || '/images/community-gathering.jpg'}
                      alt={pod.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-amber-300">
                      Ep {pod.episodeNumber || 1}
                    </div>
                    {pod.category && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-900/80 backdrop-blur-sm text-[10px] font-bold text-purple-200">
                        {pod.category}
                      </div>
                    )}
                    {pod.duration && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-300" />
                        <span>{pod.duration}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-display text-sm font-extrabold text-slate-950 line-clamp-2">
                    {pod.title}
                  </h4>
                  {pod.guests && (
                    <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                      Guests: {pod.guests}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {pod.summary || pod.description}
                  </p>

                  {pod.link && (
                    <div className="mt-3">
                      <a
                        href={pod.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5A1E65] hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{pod.link}</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <a
                    href={`/media#${pod.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-slate-500 hover:text-[#5A1E65] flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal('podcast', pod)}
                      className="p-1.5 text-purple-800 hover:bg-purple-50 rounded-lg cursor-pointer"
                      title="Edit episode"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('podcast', pod.slug || pod.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete episode"
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
          SUB-TAB: OFFICIAL BOARD OF DIRECTORS (STRICTLY 6 MEMBERS)
          ====================================================================== */}
      {activeSubTab === 'board' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-slate-950">
                  Board of Directors ({boardList.length} Members)
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                  Official Governance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage public portraits, pronouns, roles, emails, and biographies for the DCVC Board of Directors. All changes save persistently and reflect immediately.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 shrink-0">
                {boardList.length} Members Active
              </span>
              <button
                type="button"
                onClick={() => {
                  openCreateModal('staff', {
                    category: 'board',
                    title: 'Board Member',
                    role: 'Board Member',
                    pronouns: ''
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Board Member</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-amber-50/50 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-700 font-extrabold">
                Official Roster: 1. Steve Somann · 2. Celia Sandhya Daniels · 3. AJ Holmes · 4. Roland Catabona · 5. Luis Andrade · 6. Unique Dowtin
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click &quot;Edit &amp; Photo&quot; to update headshots, names, pronouns, or bio. Click the trash icon to remove any card.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardList.map((member) => (
              <div
                key={member.id || member.slug || member.name}
                className="p-5 rounded-3xl bg-white border-2 border-purple-100 hover:border-purple-300 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 relative group">
                    <img
                      src={member.photo || member.image || '/images/volunteers.jpg'}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/volunteers.jpg';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-300/30">
                      Board of Directors
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditModal('staff', member)}
                      className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 cursor-pointer backdrop-blur-[2px]"
                      title="Change Portrait"
                    >
                      <Camera className="w-6 h-6 text-amber-300" />
                      <span className="text-[11px] font-bold bg-slate-900/90 px-2.5 py-1 rounded-full border border-amber-300/40">Change Headshot</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display text-base font-black text-slate-950">
                        {member.name}
                      </h4>
                      {member.pronouns && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {member.pronouns}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-purple-700 mt-0.5">
                      {member.role || member.title}
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
                      className="px-2.5 py-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1 border border-purple-200"
                      title="Edit Member & Photo"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit &amp; Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('staff', member.id || member.slug || member.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Board Member"
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
          SUB-TAB: OPERATIONAL STAFF LEADERSHIP
          ====================================================================== */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-slate-950">
                  Operational Staff Leadership ({operationalStaffList.length} Members)
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Community Center Team
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Everyday staff managing daily drop-in hours, clinics, Rainbow Umbrella youth circles, and center operations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('staff')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operationalStaffList.map((member) => (
              <div
                key={member.id || member.slug || member.name}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 relative group">
                    <img
                      src={member.photo || member.image || '/images/volunteers.jpg'}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/volunteers.jpg';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-300/30">
                      Operational Staff
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditModal('staff', member)}
                      className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 cursor-pointer backdrop-blur-[2px]"
                      title="Change Headshot"
                    >
                      <Camera className="w-6 h-6 text-emerald-300" />
                      <span className="text-[11px] font-bold bg-slate-900/90 px-2.5 py-1 rounded-full border border-emerald-300/40">Change Headshot</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display text-base font-black text-slate-950">
                        {member.name}
                      </h4>
                      {member.pronouns && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {member.pronouns}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      {member.role || member.title}
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
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200"
                      title="Edit Staff Member & Photo"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit &amp; Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('staff', member.id || member.slug || member.name)}
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
          SUB-TAB: P.R.I.D.E. TRAININGS & WORKSHOPS
          ====================================================================== */}
      {activeSubTab === 'trainings' && (
        <div className="space-y-6">
          {/* Sub-navigation View Switcher: Courses vs Page Content & Sections */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrainingViewMode('courses')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  trainingViewMode === 'courses'
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Course Catalog ({cmsData.trainings?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setTrainingViewMode('pageContent')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  trainingViewMode === 'pageContent'
                    ? 'bg-[#5A1E65] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Page Content, Banners & FAQs</span>
              </button>
            </div>

            {trainingViewMode === 'courses' ? (
              <button
                type="button"
                onClick={() => openCreateModal('training')}
                className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Training Workshop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  saveCmsTrainingPageContent(trainingPageData);
                  showToast('Training page sections saved & published live!');
                  refreshData();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                <span>Save Page Content Live</span>
              </button>
            )}
          </div>

          {/* VIEW 1: COURSES CATALOG */}
          {trainingViewMode === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-950">
                    Workshop & Certification Modules ({cmsData.trainings?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Manage accreditation workshops, corporate tracks, and healthcare competencies displayed on /training.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cmsData.trainings || []).map((course) => (
                  <div
                    key={course.slug || course.id || course.title}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4 relative group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-[#5A1E65]">
                          {course.badge || 'P.R.I.D.E. Workshop'}
                        </span>
                        {course.isBusinessAccreditation && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            DCVC Approved Seal
                          </span>
                        )}
                        {course.isFlagship && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                            Flagship
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-500 ml-auto">
                          {course.duration || '2.5 Hours'}
                        </span>
                      </div>

                      <h4 className="font-display text-base font-extrabold text-slate-950 leading-snug">
                        {course.title}
                      </h4>

                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                        {course.summary}
                      </p>

                      <div className="pt-1 text-[11px] text-slate-600 space-y-1">
                        <div><strong className="text-slate-900">Audience:</strong> {course.targetAudience || 'All Organizations'}</div>
                        {course.format && <div><strong className="text-slate-900">Format:</strong> {course.format}</div>}
                        {course.sector && <div><strong className="text-slate-900">Sector:</strong> <span className="capitalize">{course.sector}</span></div>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono">
                        slug: /{course.slug}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal('training', course)}
                          className="px-3 py-1.5 rounded-xl text-purple-800 hover:bg-purple-50 border border-purple-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('training', course.slug || course.id)}
                          className="px-3 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: FULL PAGE CONTENT & SECTIONS EDITOR */}
          {trainingViewMode === 'pageContent' && (
            <div className="space-y-8">
              {/* Card 1: Hero & Impact Metrics */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    1. Hero Section & Impact Statistics
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customize the top hero banner and the 3 key metric highlights displayed above the fold.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hero Eyebrow Badge</label>
                    <input
                      type="text"
                      value={trainingPageData.heroEyebrow || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, heroEyebrow: e.target.value })}
                      placeholder="P.R.I.D.E. EDUCATION & ACCREDITATION"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hero Main Headline</label>
                    <input
                      type="text"
                      value={trainingPageData.heroTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, heroTitle: e.target.value })}
                      placeholder="Empower Your Team with LGBTQ+ Competency & Earn the DCVC Approved Seal"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subheadline / Mission Narrative</label>
                    <textarea
                      rows={3}
                      value={trainingPageData.heroSubtitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, heroSubtitle: e.target.value })}
                      placeholder="Ventura County's accredited workshops transforming workplaces, clinics, educators, and local storefronts..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">Metric 1</span>
                      <input
                        type="text"
                        value={trainingPageData.stat1Number || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat1Number: e.target.value })}
                        placeholder="40+"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-black text-[#5A1E65]"
                      />
                      <input
                        type="text"
                        value={trainingPageData.stat1Label || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat1Label: e.target.value })}
                        placeholder="Accredited Local Businesses"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">Metric 2</span>
                      <input
                        type="text"
                        value={trainingPageData.stat2Number || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat2Number: e.target.value })}
                        placeholder="98%"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-black text-emerald-600"
                      />
                      <input
                        type="text"
                        value={trainingPageData.stat2Label || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat2Label: e.target.value })}
                        placeholder="Trainee Satisfaction & Confidence"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">Metric 3</span>
                      <input
                        type="text"
                        value={trainingPageData.stat3Number || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat3Number: e.target.value })}
                        placeholder="100%"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-black text-amber-600"
                      />
                      <input
                        type="text"
                        value={trainingPageData.stat3Label || ''}
                        onChange={(e) => setTrainingPageData({ ...trainingPageData, stat3Label: e.target.value })}
                        placeholder="Customized for Local Realities"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: 60-Second Readiness Self-Audit Quiz */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    2. 60-Second Readiness Self-Audit Quiz
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Headings and guidance for the interactive 5-question audit quiz.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Eyebrow</label>
                    <input
                      type="text"
                      value={trainingPageData.quizEyebrow || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, quizEyebrow: e.target.value })}
                      placeholder="60-SECOND SELF-AUDIT"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title</label>
                    <input
                      type="text"
                      value={trainingPageData.quizTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, quizTitle: e.target.value })}
                      placeholder="Is Your Business Ready for DCVC Approved Status?"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Subtitle</label>
                  <input
                    type="text"
                    value={trainingPageData.quizSubtitle || ''}
                    onChange={(e) => setTrainingPageData({ ...trainingPageData, quizSubtitle: e.target.value })}
                    placeholder="Answer 5 quick questions to gauge your storefront readiness and discover your custom training track."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Card 3: Accreditation Pathway Roadmap & Fast-Track Callout Banner */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    3. Accreditation Pathway Roadmap & Callout Banner
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Headings, descriptions, and the purple Fast-Track callout banner at the bottom of the 4-step pathway.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roadmap Eyebrow</label>
                    <input
                      type="text"
                      value={trainingPageData.roadmapEyebrow || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapEyebrow: e.target.value })}
                      placeholder="OFFICIAL ACCREDITATION ROADMAP"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roadmap Title</label>
                    <input
                      type="text"
                      value={trainingPageData.roadmapTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapTitle: e.target.value })}
                      placeholder="How Your Business Becomes DCVC Approved & Certified"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Roadmap Subtitle</label>
                  <input
                    type="text"
                    value={trainingPageData.roadmapSubtitle || ''}
                    onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapSubtitle: e.target.value })}
                    placeholder="A seamless 4-step journey from staff education to trusted community storefront status..."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <span className="text-xs font-black text-[#5A1E65] block uppercase tracking-wider">
                    Purple Fast-Track Callout Banner
                  </span>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Heading</label>
                    <input
                      type="text"
                      value={trainingPageData.roadmapBannerHeading || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapBannerHeading: e.target.value })}
                      placeholder="Ready to train your team and earn the DCVC Approved seal?"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Subtext</label>
                    <input
                      type="text"
                      value={trainingPageData.roadmapBannerText || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapBannerText: e.target.value })}
                      placeholder="Join over 40+ accredited Ventura County cafes, health clinics, salons, and offices..."
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Callout Button Text</label>
                    <input
                      type="text"
                      value={trainingPageData.roadmapBannerButtonText || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, roadmapBannerButtonText: e.target.value })}
                      placeholder="Schedule Storefront Training"
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Storefront Welcome Kit Showcase */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    4. Storefront Welcome Kit Showcase
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Deliverables showcase highlighting the physical window decal, framed certificate, pins, and directory spotlight.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Welcome Kit Eyebrow</label>
                    <input
                      type="text"
                      value={trainingPageData.welcomeKitEyebrow || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, welcomeKitEyebrow: e.target.value })}
                      placeholder="TANGIBLE VALUE FOR YOUR STOREFRONT"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Welcome Kit Title</label>
                    <input
                      type="text"
                      value={trainingPageData.welcomeKitTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, welcomeKitTitle: e.target.value })}
                      placeholder="What's Inside the DCVC Approved Welcome Kit?"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Welcome Kit Subtitle</label>
                  <textarea
                    rows={2}
                    value={trainingPageData.welcomeKitSubtitle || ''}
                    onChange={(e) => setTrainingPageData({ ...trainingPageData, welcomeKitSubtitle: e.target.value })}
                    placeholder="Upon graduating from the accreditation workshop, every certified business receives our comprehensive physical and digital welcoming package..."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={trainingPageData.welcomeKitButtonText || ''}
                    onChange={(e) => setTrainingPageData({ ...trainingPageData, welcomeKitButtonText: e.target.value })}
                    placeholder="Get Your Storefront Kit"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Card 5: ROI Calculator, Testimonials & FAQs */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    5. ROI Calculator & Testimonials Copy
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Calculator Title</label>
                    <input
                      type="text"
                      value={trainingPageData.calculatorTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, calculatorTitle: e.target.value })}
                      placeholder="Estimate Your Business Impact & Training Track"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Testimonials Title</label>
                    <input
                      type="text"
                      value={trainingPageData.testimonialsTitle || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, testimonialsTitle: e.target.value })}
                      placeholder="Trusted by Ventura County Commerce"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card 6: Interactive FAQs Editor */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display text-base font-extrabold text-slate-950">
                      6. Frequently Asked Questions ({(trainingPageData.faqs || []).length})
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Edit existing questions or add new accreditation FAQ items.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = Array.isArray(trainingPageData.faqs) ? [...trainingPageData.faqs] : [];
                      updated.push({ q: 'New Question?', a: 'Answer details here.' });
                      setTrainingPageData({ ...trainingPageData, faqs: updated });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 text-[#5A1E65] hover:bg-purple-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(trainingPageData.faqs || []).map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase text-purple-900">
                          Question #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(trainingPageData.faqs || [])];
                            updated.splice(idx, 1);
                            setTrainingPageData({ ...trainingPageData, faqs: updated });
                          }}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer p-1"
                          title="Delete this question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.q || ''}
                        onChange={(e) => {
                          const updated = [...(trainingPageData.faqs || [])];
                          updated[idx] = { ...updated[idx], q: e.target.value };
                          setTrainingPageData({ ...trainingPageData, faqs: updated });
                        }}
                        placeholder="e.g. What does it take to become a DCVC Approved Business?"
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold"
                      />
                      <textarea
                        rows={3}
                        value={faq.a || ''}
                        onChange={(e) => {
                          const updated = [...(trainingPageData.faqs || [])];
                          updated[idx] = { ...updated[idx], a: e.target.value };
                          setTrainingPageData({ ...trainingPageData, faqs: updated });
                        }}
                        placeholder="Comprehensive answer..."
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 7: Section 8 Bottom Consultation & Booking Proposal Banner */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-display text-base font-extrabold text-slate-950">
                    7. Section 8 Bottom Consultation & Proposal Banner
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Configure the large purple bottom callout banner with proposal request button and phone details.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tag / Pill Label</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerTag || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerTag: e.target.value })}
                      placeholder="VENTURA COUNTY COMMERCE & EQUITY"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Heading</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerHeading || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerHeading: e.target.value })}
                      placeholder="Bring DCVC Accreditation to Your Team"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner Description Text</label>
                  <textarea
                    rows={2}
                    value={trainingPageData.bottomBannerText || ''}
                    onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerText: e.target.value })}
                    placeholder="Whether you run an independent coffee shop on Main Street or a healthcare clinic in Oxnard..."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Button Text</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerPhone || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerPhone: e.target.value })}
                      placeholder="Call (805) 644-5428"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Button Text</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerButtonText || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerButtonText: e.target.value })}
                      placeholder="Request Workshop Proposal"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bullet Point 1</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerBullet1 || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerBullet1: e.target.value })}
                      placeholder="Sliding scale for local small businesses"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bullet Point 2</label>
                    <input
                      type="text"
                      value={trainingPageData.bottomBannerBullet2 || ''}
                      onChange={(e) => setTrainingPageData({ ...trainingPageData, bottomBannerBullet2: e.target.value })}
                      placeholder="On-site or interactive virtual"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900 block font-bold">Ready to apply changes?</strong>
                  Saving updates all headlines, stats, banners, and FAQs instantly on the live website.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveCmsTrainingPageContent(trainingPageData);
                    showToast('Training page sections saved & published live!');
                    refreshData();
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all hover:scale-102 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Check className="w-4 h-4" />
                  <span>Save All Training Page Content</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          SUB-TAB: SPONSORS & COMMUNITY PARTNERSHIPS
          ====================================================================== */}
      {activeSubTab === 'sponsors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Partnerships & Official Sponsors ({cmsData.sponsors?.length || 0})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Changes sync live to the Homepage Partnership Strip, Footer, and Sponsors Directory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('sponsor')}
              className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-[#43144A] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner / Sponsor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cmsData.sponsors || []).map((sp) => (
              <div
                key={sp.id || sp.name}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {sp.logo ? (
                    <img
                      src={sp.logo}
                      alt={sp.name}
                      className="w-12 h-12 rounded-xl object-contain bg-slate-100 border border-slate-200 shrink-0 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5A1E65] flex items-center justify-center font-black text-xs shrink-0">
                      {sp.shortName || sp.name?.slice(0, 3) || 'PRT'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-extrabold text-slate-950 truncate">
                      {sp.name}
                    </h4>
                    <p className="text-[11px] font-bold text-[#5A1E65] truncate">
                      {sp.role || 'Community Partner'}
                    </p>
                    {sp.url && (
                      <p className="text-[11px] text-slate-600 truncate">{sp.url}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openEditModal('sponsor', sp)}
                    className="p-2 text-purple-800 hover:bg-purple-50 rounded-xl cursor-pointer"
                    aria-label={`Edit ${sp.name}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('sponsor', sp.id || sp.name)}
                    className="p-2 text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
                    aria-label={`Delete ${sp.name}`}
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
          SUB-TAB: SPONSORSHIP DOCUMENTS & PARTNERSHIP PACKETS
          ====================================================================== */}
      {activeSubTab === 'sponsorshipDocs' && (
        <SponsorshipManager />
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
                <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(cmsData.settings?.voicemailOnly)}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      settings: { ...cmsData.settings, voicemailOnly: e.target.checked }
                    })}
                    className="rounded text-[#5A1E65] focus:ring-purple-400"
                  />
                  <span>Toggle voicemails only (hide phone number across site and display "Send Voicemail" button)</span>
                </label>
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
                  Physical Center Address
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

              <div className="md:col-span-2 p-5 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#5A1E65]" />
                    <label className="block text-xs font-black uppercase text-slate-800 tracking-wider">
                      Community Resource Center (CRC) Operating Hours
                    </label>
                  </div>
                  {isAuthorizedAdmin ? (
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 w-fit">
                      Admin Access Granted
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 w-fit">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      Admin Role Required ({currentUser?.role || 'read_only'})
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  Public operating hours for the physical center at 2471 Portola Road. Syncs live across the public footer, contact page, and program guides. Supports standard weekday drop-in schedules and explicit closed days.
                </p>

                <input
                  type="text"
                  required
                  disabled={!isAuthorizedAdmin}
                  value={cmsData.settings?.hours || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCmsData({
                      ...cmsData,
                      settings: { ...cmsData.settings, hours: val }
                    });
                    if (val.trim().length >= 4) setHoursValidationError('');
                  }}
                  placeholder="e.g. Monday – Friday, 1:00 PM – 5:00 PM (Weekends Closed)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    !isAuthorizedAdmin
                      ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-[#5A1E65]'
                  } ${hoursValidationError ? 'border-rose-400 ring-1 ring-rose-300' : ''}`}
                />

                {hoursValidationError && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{hoursValidationError}</span>
                  </p>
                )}

                {/* Quick Presets & Closed Days Controls */}
                {isAuthorizedAdmin && (
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Quick Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsData({
                          ...cmsData,
                          settings: { ...cmsData.settings, hours: 'Monday – Friday, 1:00 PM – 5:00 PM (Weekends Closed)' }
                        });
                        setHoursValidationError('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Standard (1–5 PM Weekdays)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsData({
                          ...cmsData,
                          settings: { ...cmsData.settings, hours: 'Monday – Friday, 10:00 AM – 6:00 PM (Weekends Closed)' }
                        });
                        setHoursValidationError('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Expanded (10 AM–6 PM Weekdays)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsData({
                          ...cmsData,
                          settings: { ...cmsData.settings, hours: 'Closed Today for Staff Development & Facility Maintenance' }
                        });
                        setHoursValidationError('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer shadow-2xs"
                    >
                      Mark Closed Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsData({
                          ...cmsData,
                          settings: { ...cmsData.settings, hours: '1:00 PM – 5:00 PM Weekdays (Please call for drop-in hours)' }
                        });
                        setHoursValidationError('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#5A1E65] cursor-pointer shadow-2xs ml-auto"
                    >
                      Reset to Initial Default
                    </button>
                  </div>
                )}
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
          SUB-TAB: CARD GRADIENTS & CATEGORY THEMES STUDIO
          ====================================================================== */}
      {activeSubTab === 'cardThemes' && (
        <CardGradientStudio />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => {
                          const title = e.target.value;
                          const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                          setFormData({
                            ...formData,
                            title,
                            slug: (!editingItem || !formData.slug) ? autoSlug : formData.slug
                          });
                        }}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Slug <span className="font-normal text-slate-400">(/programs/...)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '')
                        })}
                        placeholder="e.g. youth-art-circle"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      />
                    </div>
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

                  <MultiImagePicker
                    images={formData.images || (formData.heroImage ? [formData.heroImage] : [])}
                    primaryImage={formData.heroImage || ''}
                    onChange={(newImages) => setFormData({ ...formData, images: newImages, heroImage: newImages[0] || '' })}
                    onPrimaryChange={(url) => setFormData({ ...formData, heroImage: url })}
                    label="Program Pictures & Slideshow"
                    helpText="Upload or choose multiple photos for this program. They will automatically slide on website cards and detail pages."
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

                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">Audience</label>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <Palette className="w-3.5 h-3.5 text-purple-700" />
                        <span>Badge & Text Color:</span>
                        <span 
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded-md border font-bold"
                          style={{ 
                            color: formData.audienceColor || formData.accent || '#7E22CE',
                            backgroundColor: `${formData.audienceColor || formData.accent || '#7E22CE'}15`,
                            borderColor: `${formData.audienceColor || formData.accent || '#7E22CE'}35`
                          }}
                        >
                          {formData.audienceColor || formData.accent || '#7E22CE'}
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={formData.audience || ''}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      placeholder="e.g. All LGBTQIA+ individuals, families, youth, seniors, and allies"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#5A1E65]"
                    />

                    {/* Color Chooser Option */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-600 mr-1">Choose Color:</span>
                        {[
                          { name: 'Royal Purple', hex: '#5A1E65' },
                          { name: 'Amethyst Violet', hex: '#7E22CE' },
                          { name: 'Sunset Rose', hex: '#D91B5C' },
                          { name: 'Vibrant Coral', hex: '#E11D48' },
                          { name: 'Golden Amber', hex: '#D97706' },
                          { name: 'Vibrant Emerald', hex: '#059669' },
                          { name: 'Forest Emerald', hex: '#1E5A44' },
                          { name: 'Ocean Sky', hex: '#0284C7' },
                          { name: 'Indigo Pride', hex: '#4338CA' },
                          { name: 'Deep Slate', hex: '#0F172A' }
                        ].map((c) => {
                          const activeColor = (formData.audienceColor || formData.accent || '#7E22CE').toLowerCase();
                          const isSelected = activeColor === c.hex.toLowerCase();
                          return (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setFormData({ ...formData, audienceColor: c.hex })}
                              title={c.name}
                              className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer relative ${
                                isSelected ? 'scale-125 border-slate-950 shadow-md ring-2 ring-purple-400' : 'border-white hover:scale-110 shadow-2xs'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="color"
                          value={formData.audienceColor?.startsWith('#') ? formData.audienceColor : (formData.accent?.startsWith('#') ? formData.accent : '#7E22CE')}
                          onChange={(e) => setFormData({ ...formData, audienceColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                          title="Pick custom color"
                        />
                        <input
                          type="text"
                          value={formData.audienceColor || ''}
                          onChange={(e) => setFormData({ ...formData, audienceColor: e.target.value })}
                          placeholder={formData.accent || '#7E22CE'}
                          className="w-20 px-2 py-1 text-[11px] font-mono border border-slate-300 rounded-lg text-center uppercase bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Live Badge Preview */}
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Badge Preview:</span>
                      <span
                        className="text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full border uppercase shadow-2xs transition-colors"
                        style={{
                          color: formData.audienceColor || formData.accent || '#7E22CE',
                          backgroundColor: `${formData.audienceColor || formData.accent || '#7E22CE'}15`,
                          borderColor: `${formData.audienceColor || formData.accent || '#7E22CE'}35`
                        }}
                      >
                        {formData.audience || 'Audience Preview'}
                      </span>
                    </div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Calendar Date Picker (Auto-Syncs Website Calendar)
                      </label>
                      <input
                        type="date"
                        value={formData.isoDate || parseEventDate(formData)?.isoDate || ''}
                        onChange={(e) => {
                          const iso = e.target.value;
                          const parsed = parseEventDate(iso);
                          setFormData({
                            ...formData,
                            isoDate: iso,
                            date: parsed ? parsed.displayDate : formData.date,
                            month: parsed?.monthAbbr,
                            day: parsed?.dayStr,
                            year: parsed?.yearStr
                          });
                        }}
                        className="w-full px-3 py-2 border border-purple-200 bg-purple-50/30 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Display Date Text</label>
                      <input
                        type="text"
                        required
                        value={formData.date || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseEventDate(val);
                          setFormData({
                            ...formData,
                            date: val,
                            ...(parsed ? { isoDate: parsed.isoDate, month: parsed.monthAbbr, day: parsed.dayStr, year: parsed.yearStr } : {})
                          });
                        }}
                        placeholder="e.g., August 15, 2026"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {(() => {
                    const previewDate = parseEventDate(formData);
                    return (
                      <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${
                        previewDate
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {previewDate
                            ? `Calendar Auto-Slot: ${previewDate.monthAbbr} ${previewDate.dayStr}, ${previewDate.yearStr} (${previewDate.isoDate})`
                            : 'Use Calendar Date Picker or enter e.g. "October 18, 2026" to auto-place on /events calendar.'}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <MultiImagePicker
                    images={formData.images || (formData.image ? [formData.image] : [])}
                    primaryImage={formData.image || ''}
                    onChange={(newImages) => setFormData({ ...formData, images: newImages, image: newImages[0] || '' })}
                    onPrimaryChange={(url) => setFormData({ ...formData, image: url })}
                    label="Event Photos & Rotating Flyers"
                    helpText="Upload or choose multiple flyers or event photos. They will automatically slide on event cards and calendar views."
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

                  <MultiImagePicker
                    images={formData.images || (formData.image ? [formData.image] : [])}
                    primaryImage={formData.image || ''}
                    onChange={(newImages) => setFormData({ ...formData, images: newImages, image: newImages[0] || '' })}
                    onPrimaryChange={(url) => setFormData({ ...formData, image: url })}
                    label="Article Feature & Gallery Photos"
                    helpText="Upload or choose multiple article photos. They will automatically slide on article cards."
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
                      onChange={(html) => setFormData(prev => ({ ...prev, body: html, content: html }))}
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
                      <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer text-[11px] font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.voicemailOnly)}
                          onChange={(e) => setFormData({ ...formData, voicemailOnly: e.target.checked })}
                          className="rounded text-[#5A1E65] focus:ring-purple-400"
                        />
                        <span>Toggle voicemails only (show Send Voicemail button)</span>
                      </label>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pronouns (e.g. they/them, she/her, he/him)</label>
                      <input
                        type="text"
                        placeholder="e.g. she/they, he/him, they/them"
                        value={formData.pronouns || ''}
                        onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
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

                  <ImagePicker
                    value={formData.photo || formData.image || ''}
                    onChange={(url) => setFormData({ ...formData, photo: url, image: url })}
                    label="Staff / Board Member Portrait"
                    aspectRatio="aspect-[4/3]"
                    category="avatar"
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

                  <MultiImagePicker
                    images={formData.images || (formData.image ? [formData.image] : [])}
                    primaryImage={formData.image || ''}
                    onChange={(newImages) => setFormData({ ...formData, images: newImages, image: newImages[0] || '' })}
                    onPrimaryChange={(url) => setFormData({ ...formData, image: url })}
                    label="3D Carousel Spotlight Pictures"
                    helpText="Upload or choose multiple images for this spotlight. They will automatically slide on cards."
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
                        value={formData.badge || 'Center Era'}
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
                    value={formData.image || ''}
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

              {/* Sponsor Form Fields */}
              {modalType === 'sponsor' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Partner Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Short Acronym (e.g. VCBH)</label>
                      <input
                        type="text"
                        value={formData.shortName || ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partnership Role / Tier</label>
                    <input
                      type="text"
                      required
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partner Website URL</label>
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <ImagePicker
                    value={formData.logo}
                    onChange={(url) => setFormData({ ...formData, logo: url })}
                    label="Partner Logo Image"
                  />
                </>
              )}

              {/* Training Workshop Form Fields */}
              {modalType === 'training' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Workshop Title <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. DCVC Affirming Business Accreditation"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Badge Label</label>
                      <input
                        type="text"
                        value={formData.badge || ''}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g. Official Accreditation"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g. 2.5 Hours"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sector Track</label>
                      <select
                        value={formData.sector || 'business'}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                      >
                        <option value="business">Storefront & Small Business</option>
                        <option value="healthcare">Healthcare & Clinical Care</option>
                        <option value="education">Education & Youth</option>
                        <option value="corporate">Corporate, HR & Tech</option>
                        <option value="wellness">Wellness & Salons</option>
                        <option value="general">General Community</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Session Delivery Format</label>
                      <input
                        type="text"
                        value={formData.format || ''}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                        placeholder="In-Person (On-Site) or Interactive Virtual"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                      <input
                        type="text"
                        value={formData.targetAudience || ''}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        placeholder="Storefront Retail, Cafes, Hospitality & Offices"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isBusinessAccreditation)}
                        onChange={(e) => setFormData({ ...formData, isBusinessAccreditation: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <span>DCVC Approved Storefront Accreditation</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isFlagship)}
                        onChange={(e) => setFormData({ ...formData, isFlagship: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <span>Feature as Flagship Course</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fee Structure</label>
                      <input
                        type="text"
                        value={formData.feeStructure || ''}
                        onChange={(e) => setFormData({ ...formData, feeStructure: e.target.value })}
                        placeholder="e.g. Sliding scale for local small businesses"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={formData.contactEmail || ''}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="training@diversitycollective.org"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Workshop Summary <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={3}
                      required
                      value={formData.summary || ''}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Comprehensive overview of training topics and outcomes..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Learning Objectives (One per line)</label>
                    <textarea
                      rows={3}
                      placeholder="Frontline Welcoming & Affirming Customer Care&#10;California SB 396 Compliance & Protections&#10;All-Gender Restroom Dignity"
                      value={Array.isArray(formData.learningObjectives) ? formData.learningObjectives.join('\n') : (formData.learningObjectives || '')}
                      onChange={(e) => setFormData({
                        ...formData,
                        learningObjectives: e.target.value.split('\n')
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deliverables & Materials Included (One per line)</label>
                    <textarea
                      rows={3}
                      placeholder="Official Storefront Vinyl Window Cling&#10;Framed Certificate of Excellence&#10;10 Frontline Ally & Pronoun Pins"
                      value={Array.isArray(formData.materials) ? formData.materials.join('\n') : (formData.materials || '')}
                      onChange={(e) => setFormData({
                        ...formData,
                        materials: e.target.value.split('\n')
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}

              {/* Podcast & Media Episode Form Fields */}
              {modalType === 'podcast' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Episode Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. A Decade of Resilience"
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Episode #</label>
                      <input
                        type="number"
                        value={formData.episodeNumber || 1}
                        onChange={(e) => setFormData({ ...formData, episodeNumber: parseInt(e.target.value, 10) || 1 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g. 35 min"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category / Topic</label>
                      <input
                        type="text"
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Youth Voices"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Host / Speaker</label>
                      <input
                        type="text"
                        value={formData.host || ''}
                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        placeholder="e.g. DCVC Communications Team"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Guest(s)</label>
                      <input
                        type="text"
                        value={formData.guests || ''}
                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        placeholder="e.g. Founding Members & Community Elders"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* PASTE LINK INPUT */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Podcast / Video Link (YouTube, Spotify, Apple Podcasts, Soundcloud, audio URL) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.link || ''}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... or https://open.spotify.com/..."
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Paste the URL where visitors can listen or watch this episode.
                    </p>
                  </div>

                  <ImagePicker
                    value={formData.coverImage || ''}
                    onChange={(url) => setFormData({ ...formData, coverImage: url })}
                    label="Episode Cover Image"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Summary / Description</label>
                    <textarea
                      rows={3}
                      value={formData.summary || formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value, description: e.target.value })}
                      placeholder="Brief overview of the conversation and show notes..."
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

