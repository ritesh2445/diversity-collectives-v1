import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  RotateCcw, 
  Check, 
  Eye, 
  Award, 
  Calendar, 
  BookOpen, 
  Users, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { cmsStore } from '../../services/cmsStore';

export default function CardOrderManager() {
  const [collection, setCollection] = useState('programs'); // 'programs' | 'events' | 'resources' | 'board' | 'milestones'
  const [items, setItems] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Load items from cmsStore when collection changes
  useEffect(() => {
    loadCollectionItems(collection);
  }, [collection]);

  const loadCollectionItems = (col) => {
    if (col === 'programs') {
      setItems(cmsStore.getPrograms() || []);
    } else if (col === 'events') {
      setItems(cmsStore.getEvents() || []);
    } else if (col === 'resources') {
      setItems(cmsStore.getResources() || []);
    } else if (col === 'board') {
      const allStaff = cmsStore.getStaff() || [];
      const boardOnly = allStaff.filter(s => s.category === 'board');
      setItems(boardOnly);
    } else if (col === 'milestones') {
      setItems(cmsStore.getMemoryLane() || []);
    }
  };

  const moveItem = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setItems(copy);
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex) return;
    const copy = [...items];
    const [draggedItem] = copy.splice(draggedIdx, 1);
    copy.splice(dropIndex, 0, draggedItem);
    setItems(copy);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleSaveOrder = () => {
    if (collection === 'programs') {
      cmsStore.savePrograms(items);
    } else if (collection === 'events') {
      cmsStore.saveEvents(items);
    } else if (collection === 'resources') {
      cmsStore.saveResources(items);
    } else if (collection === 'board') {
      const allStaff = cmsStore.getStaff() || [];
      const nonBoard = allStaff.filter(s => s.category !== 'board');
      cmsStore.saveStaff([...nonBoard, ...items]);
    } else if (collection === 'milestones') {
      cmsStore.saveMemoryLane(items);
    }

    setSaveStatus(`Order of ${collection} saved and published to live website!`);
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const getItemTitle = (item) => {
    return item.title || item.name || item.category || 'Untitled Item';
  };

  const getItemSubtitle = (item) => {
    if (collection === 'programs') return item.tagline || item.audience;
    if (collection === 'events') return `${item.month} ${item.day}, ${item.year} · ${item.location}`;
    if (collection === 'board') return item.role;
    if (collection === 'resources') return `${item.items?.length || 0} providers`;
    if (collection === 'milestones') return `Year ${item.year} · ${item.stat}`;
    return '';
  };

  const getItemImage = (item) => {
    return item.heroImage || item.image || item.photo || null;
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5A1E65] to-purple-800 text-amber-300 flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black text-slate-950 flex items-center gap-2">
              <span>Card Arrangement & Hierarchy Manager</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5A1E65]">
                Card Ordering
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Drag or use arrows to change the exact display order of cards across Programs, Events, Resources, Board Members, and Milestones.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveOrder}
          className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save & Publish Order</span>
        </button>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs text-center flex items-center justify-center gap-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Collection Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200">
        {[
          { id: 'programs', label: 'Programs Cards', icon: BookOpen },
          { id: 'events', label: 'Events Cards', icon: Calendar },
          { id: 'board', label: 'Board of Directors Cards', icon: Award },
          { id: 'resources', label: 'Resource Groups', icon: Users },
          { id: 'milestones', label: 'Memory Lane Milestones', icon: Sparkles }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCollection(tab.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                collection === tab.id
                  ? 'bg-white text-[#5A1E65] shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reorderable List of Cards */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-500">
          <span>Arrange Order for {collection.toUpperCase()} ({items.length} cards)</span>
          <span>Position 1 appears first on the public website</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {items.map((item, idx) => {
            const isDragging = draggedIdx === idx;
            const isOver = dragOverIdx === idx;
            const img = getItemImage(item);

            return (
              <div
                key={item.id || item.slug || item.name || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isDragging
                    ? 'opacity-40 scale-95 border-purple-400 bg-purple-50'
                    : isOver
                    ? 'border-purple-600 bg-purple-100 shadow-md translate-y-1'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                {/* Drag Handle & Order Badge */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-purple-700 p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <span className="w-7 h-7 rounded-xl bg-purple-100 text-[#5A1E65] font-black text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Thumbnail if present */}
                  {img && (
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="truncate">
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {getItemTitle(item)}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {getItemSubtitle(item)}
                    </p>
                  </div>
                </div>

                {/* Move Controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-20 cursor-pointer"
                    title="Move Card Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-20 cursor-pointer"
                    title="Move Card Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Save Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Changes will take effect instantly across all visitor sessions.
          </span>
          <button
            type="button"
            onClick={handleSaveOrder}
            className="px-5 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish New Card Order</span>
          </button>
        </div>
      </div>

    </div>
  );
}
