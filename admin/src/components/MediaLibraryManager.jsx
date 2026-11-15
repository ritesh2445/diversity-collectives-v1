import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Search, 
  Grid, 
  List, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Filter, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getMediaFolders, 
  getMediaLibraryAssets, 
  bulkDeleteMediaAssets, 
  purgeCdnCache 
} from '../services/adminClient.js';
import { uploadAndStoreImage } from '../services/imageService.js';

export default function MediaLibraryManager({ onTriggerFeedback, onSelectAsset }) {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedIds, setSelectedIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFolders();
    loadAssets();
  }, [activeFolder, searchQuery]);

  const loadFolders = async () => {
    const f = await getMediaFolders();
    setFolders(f);
  };

  const loadAssets = async () => {
    const a = await getMediaLibraryAssets(activeFolder, searchQuery);
    setAssets(a);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        await uploadAndStoreImage(file, activeFolder === 'all' ? 'banners' : activeFolder);
      }
      await loadAssets();
      onTriggerFeedback?.(`Successfully uploaded and compressed ${files.length} asset(s).`);
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} media asset(s)?`)) return;

    await bulkDeleteMediaAssets(selectedIds);
    setSelectedIds([]);
    await loadAssets();
    onTriggerFeedback?.(`${selectedIds.length} media asset(s) deleted.`);
  };

  const handlePurgeCdn = async () => {
    setIsPurging(true);
    try {
      const selectedUrls = assets.filter(a => selectedIds.includes(a.id)).map(a => a.cdnUrl);
      const res = await purgeCdnCache(selectedUrls);
      onTriggerFeedback?.(res.message);
    } catch (err) {
      alert('CDN purge error: ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 2: CONTENT & MEDIA ASSETS
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#5A1E65]" />
            <span>Digital Media Library & Global Edge CDN</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize event photography, community banners, and brand vectors. Built-in WebP compression, bulk operations, and instant edge CDN cache invalidation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePurgeCdn}
            disabled={isPurging}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Invalidate Edge CDN cache globally"
          >
            {isPurging ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
            <span>{isPurging ? 'Purging CDN...' : 'Purge Edge CDN'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Compressing...' : 'Upload Asset'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Main Grid: Left Folders Sidebar + Right Asset View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Folders Navigation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-purple-700" />
              <span>Asset Folders</span>
            </h3>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              title="Add New Folder"
            >
              <FolderPlus className="w-4 h-4 text-purple-700" />
            </button>
          </div>

          <div className="space-y-1">
            {folders.map(f => {
              const isActive = activeFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#5A1E65] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{f.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-[#5A1E65] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>WebP Optimization</span>
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Images are automatically converted to optimized WebP at max 1600px width before upload to ensure sub-second page loads.
              </p>
            </div>
          </div>
        </div>

        {/* Right Asset View & Controls */}
        <div className="md:col-span-3 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl w-full sm:w-64 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
              />
            </div>

            {/* Selection & Bulk Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded-lg font-mono">
                    {selectedIds.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}

              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {selectedIds.length === assets.length && assets.length > 0 ? 'Deselect All' : 'Select All'}
              </button>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-500'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'list' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-500'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map(asset => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between ${
                      isSelected ? 'ring-2 ring-[#5A1E65] border-purple-400' : 'border-slate-200'
                    }`}
                  >
                    <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(asset.id);
                        }}
                        className={`absolute top-2 left-2 p-1 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                          isSelected ? 'bg-[#5A1E65] text-white' : 'bg-slate-900/60 text-white hover:bg-slate-900/90'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 truncate block" title={asset.name}>
                          {asset.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{asset.dimensions}</span>
                          <span>•</span>
                          <span>{asset.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(asset.cdnUrl)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedUrl === asset.cdnUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUrl === asset.cdnUrl ? 'Copied' : 'CDN Link'}</span>
                        </button>

                        {onSelectAsset && (
                          <button
                            type="button"
                            onClick={() => onSelectAsset(asset.cdnUrl || asset.url)}
                            className="px-2 py-0.5 rounded bg-purple-100 text-[#5A1E65] text-[10px] font-bold hover:bg-purple-200 cursor-pointer"
                          >
                            Use
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {assets.map(asset => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div key={asset.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleSelect(asset.id)}
                        className={`p-1 rounded-md cursor-pointer ${isSelected ? 'text-[#5A1E65]' : 'text-slate-400'}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <img src={asset.url} alt={asset.name} className="w-12 h-10 object-cover rounded-lg border border-slate-200" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{asset.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>Folder: {asset.folder}</span>
                          <span>•</span>
                          <span>{asset.dimensions}</span>
                          <span>•</span>
                          <span>{asset.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(asset.cdnUrl)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-slate-100 cursor-pointer"
                        title="Copy CDN link"
                      >
                        {copiedUrl === asset.cdnUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-slate-950 flex items-center justify-center p-2">
              <img src={previewAsset.url} alt={previewAsset.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{previewAsset.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Folder: {previewAsset.folder} · {previewAsset.dimensions} · {previewAsset.size}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="truncate max-w-md text-slate-600">{previewAsset.cdnUrl}</span>
                <button
                  onClick={() => handleCopyLink(previewAsset.cdnUrl)}
                  className="text-purple-700 font-bold ml-2 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Media Folder</h3>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. youth-gallery"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newFolderName.trim()) {
                    setFolders([...folders, { id: newFolderName.toLowerCase().replace(/\s+/g, '-'), name: newFolderName, count: 0 }]);
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                    onTriggerFeedback?.('New media folder created.');
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-[#5A1E65] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
