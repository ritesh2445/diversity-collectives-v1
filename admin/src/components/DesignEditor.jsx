import React, { useState } from 'react';
import { 
  GripVertical, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  Heart, 
  Shield, 
  Users, 
  Layers, 
  Sliders, 
  Type, 
  Palette, 
  Compass, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { 
  DEFAULT_PAGE_BLOCKS, 
  getSavedPageLayout, 
  savePageLayout 
} from '../services/adminClient.js';

function generateDefaultProps(type) {
  switch (type) {
    case 'status_pill':
      return {
        headline: 'Sanctuary Open Today',
        schedule: 'Mon–Fri 1:00 PM – 5:00 PM',
        serviceTag: 'Free HIV/STI Screenings',
        linkUrl: '/programs/community-resource-center'
      };
    case 'hero_banner':
      return {
        eyebrow: 'ESTABLISHED 2014 • VENTURA COUNTY 501(C)(3) NONPROFIT',
        titleLine1: 'You Are',
        titleAccentWord: 'Always',
        titleLine2: 'Welcome Here.',
        description: "Diversity Collective is Ventura County's premier cultural sanctuary and clinical wellness home — delivering free rapid health testing, youth peer programs, mutual aid, and intersectional advocacy across all 10 county cities.",
        primaryCtaText: 'Explore Free Programs',
        primaryCtaUrl: '/programs',
        secondaryCtaText: 'Visit Sanctuary',
        secondaryCtaUrl: '/contact',
        phoneText: '(805) 644-LGBT (5428)',
        phoneUrl: 'tel:8056445428',
        photoUrl: '/images/community-gathering.jpg',
        locationBadge: '2471 Portola Road, Suite 100, Ventura'
      };
    case 'wave_ribbon':
      return {
        gradientTheme: 'electric_pride',
        hasWhiteStroke: true,
        hasCrestHighlight: true,
        motionSpeed: 'standard'
      };
    case 'four_pillars':
      return {
        pillars: [
          { id: 'people', label: 'PEOPLE', icon: 'Users', url: '/community' },
          { id: 'safety', label: 'SAFETY', icon: 'Shield', url: '/programs/community-resource-center' },
          { id: 'wellness', label: 'WELLNESS', icon: 'Lotus', url: '/programs/diversity-shines' },
          { id: 'opportunity', label: 'OPPORTUNITY', icon: 'Heart', url: '/donate' }
        ]
      };
    case 'impact_stats':
      return {
        stat1Number: '10+',
        stat1Label: 'Years of Community Service',
        stat2Number: '5,000+',
        stat2Label: 'Free Health Screenings',
        stat3Number: '1,200+',
        stat3Label: 'LGBTQ+ Youth Empowered'
      };
    case 'zeffy_giving':
      return {
        headline: 'Fueling Dignity & Free Healthcare in Ventura County',
        description: '100% of your gift supports confidential rapid HIV/STI testing, peer youth circles, and cultural safe harbors with 0% platform fees via Zeffy.',
        ctaText: 'Support Our Community'
      };
    case 'event_spotlight':
      return {
        eventTitle: 'Rainbow Umbrella Youth Circle',
        eventSchedule: 'Every Friday • 5:30 PM – 7:30 PM • Ventura Sanctuary',
        badge: 'Featured Gathering'
      };
    default:
      return {};
  }
}

export default function DesignEditor({ onPublishSuccess }) {
  const [blocks, setBlocks] = useState(getSavedPageLayout);
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[1]?.id || blocks[0]?.id);
  const [viewport, setViewport] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [activePreset, setActivePreset] = useState('custom');
  const [saveStatus, setSaveStatus] = useState('');

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || blocks[0];

  // --------------------------------------------------------------------------
  // Drag and Drop Handlers
  // --------------------------------------------------------------------------
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    setBlocks(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Reorder buttons (Accessibility & quick shifts)
  const moveBlock = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setBlocks(reordered);
  };

  // Block management
  const toggleBlockVisibility = (id) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const duplicateBlock = (id) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: `block-${Date.now()}`,
      title: `${original.title} (Copy)`
    };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, copy);
    setBlocks(updated);
    setSelectedBlockId(copy.id);
  };

  const removeBlock = (id) => {
    if (blocks.length <= 1) {
      alert('You must maintain at least one block on the page canvas.');
      return;
    }
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    if (selectedBlockId === id) {
      setSelectedBlockId(updated[0]?.id || null);
    }
  };

  const addBlockFromPalette = (type, title) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      title,
      enabled: true,
      props: generateDefaultProps(type)
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateSelectedBlockProps = (propKey, value) => {
    setBlocks(blocks.map(b => {
      if (b.id === selectedBlockId) {
        return {
          ...b,
          props: {
            ...b.props,
            [propKey]: value
          }
        };
      }
      return b;
    }));
  };

  const updateSelectedBlockTitle = (newTitle) => {
    setBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, title: newTitle } : b));
  };

  // Presets
  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'default') {
      setBlocks(DEFAULT_PAGE_BLOCKS);
      setSelectedBlockId(DEFAULT_PAGE_BLOCKS[1]?.id);
    } else if (presetName === 'pride_month') {
      const prideBlocks = DEFAULT_PAGE_BLOCKS.map(b => {
        if (b.type === 'hero_banner') {
          return {
            ...b,
            props: {
              ...b.props,
              eyebrow: '🌈 JUNE PRIDE MONTH • VENTURA COUNTY CELEBRATION',
              titleLine1: 'Ventura County',
              titleAccentWord: 'Pride',
              titleLine2: 'All 10 Cities, One Family.',
              description: 'Celebrating LGBTQ+ joy, resilience, and unity across Ventura County with parades, youth prom, festival booths, and community safe harbors.'
            }
          };
        }
        return b;
      });
      setBlocks(prideBlocks);
    } else if (presetName === 'youth_focus') {
      const youthBlocks = DEFAULT_PAGE_BLOCKS.map(b => {
        if (b.type === 'hero_banner') {
          return {
            ...b,
            props: {
              ...b.props,
              eyebrow: 'SAFE HARBOR FOR TEENS & KIDS • AGES 9–23',
              titleLine1: 'Youth Are',
              titleAccentWord: 'Cherished',
              titleLine2: 'Here.',
              description: 'Free peer support circles, Youth Pride Prom, art workshops, and safe hangout hours every Friday at our Ventura Community Resource Center.'
            }
          };
        }
        return b;
      });
      setBlocks(youthBlocks);
    }
  };

  const handleSave = () => {
    savePageLayout(blocks);
    setSaveStatus('Layout successfully published to live preview store!');
    if (onPublishSuccess) onPublishSuccess();
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const exportConfigJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `dcvc-layout-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      
      {/* Top Action & Viewport Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Drag & Drop Visual Page Designer</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5A1E65]">
                Admin Studio
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Visually reorder homepage sections, edit headline copy, toggle gradients, and preview across mobile, tablet, and desktop.
            </p>
          </div>
        </div>

        {/* Viewport & Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Responsive Viewport Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mobile Device View (390px - Matches Mockup)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (390px)</span>
            </button>

            <button
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tablet View (768px iPad)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet (768px)</span>
            </button>

            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white text-[#5A1E65] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Desktop View (Full Width)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
          </div>

          {/* Quick Preset Templates */}
          <select
            value={activePreset}
            onChange={(e) => applyPreset(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none"
          >
            <option value="custom">Templates: Custom</option>
            <option value="default">Default Flagship Layout</option>
            <option value="pride_month">Pride Month Celebration</option>
            <option value="youth_focus">Youth Sanctuary Focus</option>
          </select>

          {/* Export JSON */}
          <button
            onClick={exportConfigJson}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Export layout configuration JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (window.confirm('Reset all blocks to original DCVC Flagship layout?')) {
                applyPreset('default');
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Reset to default layout"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save & Publish */}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish Layout</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 px-4 rounded-xl shadow-xs animate-fade-in">
          {saveStatus}
        </div>
      )}

      {/* Main 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Block Palette & Reorder Hierarchy */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Section Hierarchy & Drag List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#5A1E65]" />
                <span>Page Block Order ({blocks.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Drag to Reorder</span>
            </div>

            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const isSelected = block.id === selectedBlockId;
                const isDragging = draggedIdx === idx;
                const isOver = dragOverIdx === idx;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isDragging ? 'opacity-40 scale-95 border-purple-400 bg-purple-50' :
                      isOver ? 'border-purple-600 bg-purple-100 shadow-md translate-y-1' :
                      isSelected ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-600' :
                      'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-purple-700">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-extrabold text-slate-900 truncate">
                          {block.title}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-tight">
                          {block.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Move Up / Down */}
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                        disabled={idx === blocks.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBlockVisibility(block.id); }}
                        className={`p-1 transition-colors cursor-pointer ${
                          block.enabled ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={block.enabled ? 'Hide Block' : 'Show Block'}
                      >
                        {block.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                        className="p-1 text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                        title="Duplicate Block"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Component Library: Add New Blocks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#5A1E65]" />
              <span>Add Component Block</span>
            </span>

            <div className="grid grid-cols-1 gap-2">
              {[
                { type: 'hero_banner', title: 'Flagship Hero Banner', icon: Sparkles, desc: 'Headline, liquid rainbow, CTAs' },
                { type: 'status_pill', title: 'Sanctuary Live Status', icon: Compass, desc: 'Pulsing green dot & hours' },
                { type: 'wave_ribbon', title: 'Continuous Aurora Waves', icon: Flame, desc: 'Full-bleed pride wave river' },
                { type: 'four_pillars', title: '4-Pillars Accent Strip', icon: Award, desc: 'People, Safety, Wellness, Opp' },
                { type: 'impact_stats', title: 'Impact Milestones (3)', icon: Users, desc: 'Counters & track record stats' },
                { type: 'zeffy_giving', title: 'Zeffy Community Giving', icon: Heart, desc: '0% fee donation appeal card' },
                { type: 'event_spotlight', title: 'Event Spotlight Card', icon: Compass, desc: 'Featured event & calendar link' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => addBlockFromPalette(item.type, item.title)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-[#5A1E65] group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="block text-xs font-bold text-slate-800 group-hover:text-purple-950">
                        {item.title}
                      </span>
                      <span className="block text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Live Interactive Visual Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-800 text-white rounded-t-2xl text-xs font-bold">
            <span>Visual Canvas: {viewport.toUpperCase()}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {viewport === 'mobile' ? '390 × 844 px' : viewport === 'tablet' ? '768 × 1024 px' : '100% Fluid Width'}
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div className={`w-full transition-all duration-300 bg-slate-200 p-3 sm:p-6 rounded-b-2xl min-h-[600px] flex justify-center overflow-x-auto ${
            viewport === 'mobile' ? 'max-w-[440px]' : viewport === 'tablet' ? 'max-w-[820px]' : 'max-w-full'
          }`}>
            
            {/* The Screen Mockup Frame */}
            <div className={`w-full bg-[#FFFDF9] text-slate-950 shadow-2xl rounded-2xl overflow-hidden border border-purple-200/80 transition-all duration-300 ${
              viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full'
            }`}>
              
              {/* Fake Mobile Status Bar / Top Header */}
              <div className="bg-[#FAF5FF] border-b border-purple-200 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-700"></span>
                  <span className="text-[11px] font-black tracking-tight text-slate-900">diversity collective</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[10px] font-bold text-[#5A1E65]">( * )</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200">Exit</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black">Donate</span>
                </div>
              </div>

              {/* RENDER CANVAS BLOCKS */}
              <div className="flex flex-col">
                {blocks.map((block) => {
                  if (!block.enabled) return null;
                  const isSelected = block.id === selectedBlockId;

                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative group transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-purple-600 ring-offset-2 z-10' 
                          : 'hover:ring-1 hover:ring-purple-400'
                      }`}
                    >
                      {/* Active Block Label Pill */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 z-30 px-2.5 py-0.5 rounded-full bg-purple-900 text-white text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                          <span>Editing: {block.title}</span>
                        </div>
                      )}

                      {/* Render Individual Block Types */}
                      {block.type === 'status_pill' && (
                        <div className="px-4 py-3 bg-[#FFFDF9]">
                          <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white border border-purple-200/90 shadow-2xs text-[11px]">
                            <div className="flex items-center gap-2 truncate">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="font-bold text-slate-800 truncate">
                                <strong className="text-emerald-700">{block.props.headline}</strong> • {block.props.schedule} • <strong className="text-[#5A1E65]">{block.props.serviceTag}</strong>
                              </span>
                            </div>
                            <span className="text-purple-800 text-xs">→</span>
                          </div>
                        </div>
                      )}

                      {block.type === 'hero_banner' && (
                        <div className="px-4 py-4 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5FF] to-[#FFFDF9] flex flex-col gap-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-950 text-[9px] font-black uppercase tracking-wider self-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{block.props.eyebrow}</span>
                          </div>

                          <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-950 leading-tight">
                            <span className="block">{block.props.titleLine1}</span>
                            <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-purple-600 font-black">
                              {block.props.titleAccentWord}
                            </span>
                            <span className="block">{block.props.titleLine2}</span>
                          </h1>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {block.props.description}
                          </p>

                          <div className="flex flex-col gap-2 pt-1">
                            <div className="py-2.5 px-5 rounded-full text-center text-xs font-black text-white bg-gradient-to-r from-[#5A1E65] via-purple-700 to-indigo-600 shadow-sm">
                              {block.props.primaryCtaText} →
                            </div>
                            <div className="py-2.5 px-5 rounded-full text-center text-xs font-bold text-slate-800 bg-white border border-purple-200">
                              📍 {block.props.secondaryCtaText}
                            </div>
                            <div className="py-2 px-5 rounded-full text-center text-xs font-bold text-slate-800 bg-white border border-purple-200">
                              📞 {block.props.phoneText}
                            </div>
                          </div>

                          {/* Image Thumbnail */}
                          <div className="relative mt-2 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-purple-200">
                            <img src={block.props.photoUrl} alt="Community" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-slate-950/80 text-white text-[9px] font-bold">
                              📍 {block.props.locationBadge}
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'wave_ribbon' && (
                        <div className="relative w-full -mt-6 pointer-events-none overflow-hidden leading-none">
                          <svg className="w-full h-16 block" viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="live-wave-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="#FB7185" stopOpacity="0.75" />
                                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.7" />
                              </linearGradient>
                              <linearGradient id="live-wave-magenta" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.85" />
                                <stop offset="50%" stopColor="#9333EA" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.75" />
                              </linearGradient>
                            </defs>
                            <path d="M 0,140 C 240,150 480,120 720,80 C 960,40 1000,50 1000,80 L 1000,200 L 0,200 Z" fill="url(#live-wave-amber)" />
                            <path d="M 0,120 C 220,130 460,90 700,50 C 940,20 1000,30 1000,50 L 1000,200 L 0,200 Z" fill="url(#live-wave-magenta)" />
                            {block.props.hasWhiteStroke && (
                              <path d="M 0,120 C 220,130 460,90 700,50 C 940,20 1000,30 1000,50" stroke="rgba(255,255,255,0.95)" strokeWidth="3" fill="none" />
                            )}
                          </svg>
                        </div>
                      )}

                      {block.type === 'four_pillars' && (
                        <div className="w-full border-t-2 border-purple-200 bg-white/70 py-3">
                          <div className="grid grid-cols-4 divide-x divide-purple-100 text-center">
                            {block.props.pillars.map((pil) => (
                              <div key={pil.id} className="flex flex-col items-center gap-1">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-[#5A1E65]">
                                  {pil.id === 'people' ? <Users className="w-3.5 h-3.5" /> :
                                   pil.id === 'safety' ? <Shield className="w-3.5 h-3.5" /> :
                                   pil.id === 'opportunity' ? <Heart className="w-3.5 h-3.5" /> :
                                   <Sparkles className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-800">{pil.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {block.type === 'impact_stats' && (
                        <div className="px-4 py-4 bg-purple-50/50 border-t border-purple-100">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white border border-purple-200">
                              <span className="block text-base font-extrabold text-[#5A1E65]">{block.props.stat1Number}</span>
                              <span className="text-[9px] text-slate-500 leading-tight block">{block.props.stat1Label}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-purple-200">
                              <span className="block text-base font-extrabold text-teal-700">{block.props.stat2Number}</span>
                              <span className="text-[9px] text-slate-500 leading-tight block">{block.props.stat2Label}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-purple-200">
                              <span className="block text-base font-extrabold text-amber-700">{block.props.stat3Number}</span>
                              <span className="text-[9px] text-slate-500 leading-tight block">{block.props.stat3Label}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'zeffy_giving' && (
                        <div className="px-4 py-4 bg-amber-50/60 border-t border-amber-200/80">
                          <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs">
                            <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block mb-1">
                              100% Zero-Fee Non-Profit Giving
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">{block.props.headline}</h4>
                            <p className="text-[10px] text-slate-600 mb-2">{block.props.description}</p>
                            <button className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] shadow-xs">
                              {block.props.ctaText} →
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'event_spotlight' && (
                        <div className="px-4 py-4 bg-white border-t border-slate-200">
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                            <span className="text-[9px] font-black uppercase text-purple-800">Featured Gathering</span>
                            <h4 className="text-xs font-bold text-slate-900 mt-0.5">Rainbow Umbrella Youth Circle</h4>
                            <p className="text-[10px] text-slate-500">Every Friday • 5:30 PM – 7:30 PM • Ventura Sanctuary</p>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Inspector & Block Properties Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#5A1E65]" />
                <span>Block Inspector</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-[#5A1E65] font-bold">
                {selectedBlock.type}
              </span>
            </div>

            {/* Block Title Field */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Block Name
                </label>
                <input
                  type="text"
                  value={selectedBlock.title}
                  onChange={(e) => updateSelectedBlockTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Dynamic Inspector Form based on Block Type */}
              {selectedBlock.type === 'hero_banner' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.eyebrow}
                      onChange={(e) => updateSelectedBlockProps('eyebrow', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Headline (Line 1)
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.titleLine1}
                      onChange={(e) => updateSelectedBlockProps('titleLine1', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rainbow Liquid Word
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.titleAccentWord}
                      onChange={(e) => updateSelectedBlockProps('titleAccentWord', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Headline (Line 2)
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.titleLine2}
                      onChange={(e) => updateSelectedBlockProps('titleLine2', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mission Copy
                    </label>
                    <textarea
                      rows={3}
                      value={selectedBlock.props.description}
                      onChange={(e) => updateSelectedBlockProps('description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary CTA Text
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.primaryCtaText}
                      onChange={(e) => updateSelectedBlockProps('primaryCtaText', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </>
              )}

              {selectedBlock.type === 'status_pill' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Text
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.headline}
                      onChange={(e) => updateSelectedBlockProps('headline', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hours Schedule
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.schedule}
                      onChange={(e) => updateSelectedBlockProps('schedule', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Accent Tag
                    </label>
                    <input
                      type="text"
                      value={selectedBlock.props.serviceTag}
                      onChange={(e) => updateSelectedBlockProps('serviceTag', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </>
              )}

              {selectedBlock.type === 'wave_ribbon' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Wave Gradient Theme
                    </label>
                    <select
                      value={selectedBlock.props.gradientTheme}
                      onChange={(e) => updateSelectedBlockProps('gradientTheme', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="electric_pride">Electric Pride (Amber, Magenta, Cyan)</option>
                      <option value="sunset_rose">Sunset Coral & Rose</option>
                      <option value="coastal_teal">Coastal Emerald & Oceanic Teal</option>
                      <option value="royal_amethyst">Royal Amethyst & Ultraviolet</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-slate-700">White Crest Line</span>
                    <input
                      type="checkbox"
                      checked={selectedBlock.props.hasWhiteStroke}
                      onChange={(e) => updateSelectedBlockProps('hasWhiteStroke', e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded-sm"
                    />
                  </div>
                </>
              )}

              {selectedBlock.type === 'impact_stats' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Stat 1
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={selectedBlock.props.stat1Number}
                        onChange={(e) => updateSelectedBlockProps('stat1Number', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Number"
                      />
                      <input
                        type="text"
                        value={selectedBlock.props.stat1Label}
                        onChange={(e) => updateSelectedBlockProps('stat1Label', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Label"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Stat 2
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={selectedBlock.props.stat2Number}
                        onChange={(e) => updateSelectedBlockProps('stat2Number', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Number"
                      />
                      <input
                        type="text"
                        value={selectedBlock.props.stat2Label}
                        onChange={(e) => updateSelectedBlockProps('stat2Label', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Label"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Stat 3
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={selectedBlock.props.stat3Number}
                        onChange={(e) => updateSelectedBlockProps('stat3Number', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Number"
                      />
                      <input
                        type="text"
                        value={selectedBlock.props.stat3Label}
                        onChange={(e) => updateSelectedBlockProps('stat3Label', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border text-xs"
                        placeholder="Label"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Duplicate & Remove Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => duplicateBlock(selectedBlock.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => removeBlock(selectedBlock.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Block</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
