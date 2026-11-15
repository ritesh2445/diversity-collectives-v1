import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Command, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Heart, 
  Mail, 
  ShieldCheck, 
  Activity, 
  Database, 
  Layers, 
  FileText, 
  Image, 
  Sliders, 
  Users, 
  X,
  Zap,
  BarChart3
} from 'lucide-react';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onTriggerAction 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commandItems = [
    // Navigation Targets
    { id: 'nav-overview', label: 'Go to Dashboard Overview', category: 'Navigation', icon: Layers, action: () => onNavigate('overview') },
    { id: 'nav-cms', label: 'Go to Site Content (CMS Studio)', category: 'Navigation', icon: Sparkles, action: () => onNavigate('cms') },
    { id: 'nav-directory', label: 'Go to Community Directory Moderation', category: 'Navigation', icon: Building2, action: () => onNavigate('directory') },
    { id: 'nav-donations', label: 'Go to Donations & Appreciation Cards', category: 'Navigation', icon: Heart, action: () => onNavigate('donations') },
    { id: 'nav-inquiries', label: 'Go to Inquiries & Volunteer Intake', category: 'Navigation', icon: Mail, action: () => onNavigate('inquiries') },
    { id: 'nav-media', label: 'Go to Media Library & Asset Manager', category: 'Navigation', icon: Image, action: () => onNavigate('media') },
    { id: 'nav-operations', label: 'Go to Operations, Health & Firewall', category: 'Navigation', icon: Activity, action: () => onNavigate('operations') },
    { id: 'nav-analytics', label: 'Go to Analytics & Custom Report Builder', category: 'Navigation', icon: BarChart3, action: () => onNavigate('analytics') },
    { id: 'nav-ai', label: 'Go to AI Studio & Smart Insights', category: 'Navigation', icon: Zap, action: () => onNavigate('ai') },
    { id: 'nav-workflows', label: 'Go to Tasks & Approval Workflows', category: 'Navigation', icon: FileText, action: () => onNavigate('workflows') },
    { id: 'nav-iam', label: 'Go to IAM, 2FA & Custom Role Builder', category: 'Navigation', icon: ShieldCheck, action: () => onNavigate('iam') },
    { id: 'nav-status', label: 'Go to Site Status & Banners', category: 'Navigation', icon: Sliders, action: () => onNavigate('status') },

    // Instant Quick Actions
    { id: 'act-2fa', label: 'Set Up Authenticator (2FA TOTP)', category: 'Security', icon: ShieldCheck, action: () => onTriggerAction('setup_2fa') },
    { id: 'act-backup', label: 'Trigger Instant Database Backup Snapshot', category: 'Operations', icon: Database, action: () => onTriggerAction('backup_db') },
    { id: 'act-purge-cdn', label: 'Purge Global Edge CDN Cache', category: 'Operations', icon: Zap, action: () => onTriggerAction('purge_cdn') },
    { id: 'act-export-donations', label: 'Export Donations to CSV', category: 'Finance', icon: Heart, action: () => onTriggerAction('export_donations') },
    { id: 'act-ai-digest', label: 'Generate Weekly Executive AI Summary', category: 'AI Tools', icon: Sparkles, action: () => onTriggerAction('generate_digest') },
    { id: 'act-new-biz', label: 'Moderate Pending Directory Submissions', category: 'Community', icon: Building2, action: () => onNavigate('directory') }
  ];

  const filteredItems = commandItems.filter(item => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <Command className="w-5 h-5 text-purple-700" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, listings, tools, or type a query..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-slate-100/60">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No commands found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for "2FA", "Backup", "Directory", or "Media"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer text-xs ${
                    isSelected 
                      ? 'bg-[#5A1E65] text-white shadow-xs' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#5A1E65]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block text-sm">{item.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'} font-medium`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold flex items-center gap-1">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>Navigate <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↓</kbd></span>
            <span>Execute <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd></span>
          </div>
          <span>DCVC Command Palette</span>
        </div>
      </div>
    </div>
  );
}
