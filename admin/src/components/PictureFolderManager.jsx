import React, { useState, useRef } from 'react';
import { 
  FolderPlus, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  MoveUp, 
  MoveDown, 
  Check, 
  Plus, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  X
} from 'lucide-react';
import { DCVC_IMAGE_LIBRARY, uploadAndStoreImage } from '../services/imageService.js';

export default function PictureFolderManager({ 
  photos = [], 
  onChange, 
  title = 'Memory Lane Picture Folder / Photo Album',
  description = 'Attach an album of archival photos to this historical milestone. Visitors on the public website can browse the entire collection.'
}) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const newItems = [];
      for (const file of files) {
        const result = await uploadAndStoreImage(file, 'memory-lane');
        newItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: result.url,
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        });
      }
      onChange([...photos, ...newItems]);
    } catch (err) {
      alert('Error uploading photos: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddFromLibrary = (libPath, libName) => {
    const newItem = {
      id: `photo-lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: libPath,
      caption: libName
    };
    onChange([...photos, newItem]);
  };

  const handleRemovePhoto = (id) => {
    onChange(photos.filter(p => p.id !== id));
  };

  const handleCaptionChange = (id, newCaption) => {
    onChange(photos.map(p => p.id === id ? { ...p, caption: newCaption } : p));
  };

  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
        <div>
          <h4 className="font-extrabold text-sm text-[#5A1E65] flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#5A1E65]" />
            <span>{title} ({photos.length} Photos)</span>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Photos (Folder)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100 border border-purple-300 text-[#5A1E65] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Add from DCVC Archive</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleFiles}
            className="hidden"
          />
        </div>
      </div>

      {/* Photos Grid in the Folder */}
      {photos.length === 0 ? (
        <div className="py-8 text-center bg-white rounded-xl border border-dashed border-purple-200 space-y-2">
          <ImageIcon className="w-8 h-8 text-purple-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">No archival photos in this milestone folder yet.</p>
          <p className="text-[11px] text-slate-400">Click "Upload Photos" to add multiple historical pictures at once.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((item, index) => (
            <div 
              key={item.id || index}
              className="bg-white rounded-xl border border-purple-200 p-2.5 shadow-xs space-y-2 relative group"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 relative">
                <img
                  src={item.url}
                  alt={item.caption || 'Archival Photo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/community-gathering.jpg';
                  }}
                />
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  #{index + 1}
                </span>

                {/* Move & Delete Controls */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-white/30 text-white disabled:opacity-20 cursor-pointer"
                    title="Move Earlier"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === photos.length - 1}
                    className="p-1 rounded hover:bg-white/30 text-white disabled:opacity-20 cursor-pointer"
                    title="Move Later"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(item.id)}
                    className="p-1 rounded hover:bg-rose-600 text-rose-200 cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={item.caption || ''}
                onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                placeholder="Photo caption (e.g. Youth Summit)"
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#5A1E65]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Library Picker Modal for Folder */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#5A1E65]" />
                <span>Select Archival Photos to Add to Folder</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DCVC_IMAGE_LIBRARY.map((libItem) => (
                <div
                  key={libItem.id}
                  onClick={() => handleAddFromLibrary(libItem.path, libItem.name)}
                  className="rounded-xl border border-slate-200 hover:border-[#5A1E65] overflow-hidden cursor-pointer group shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={libItem.path}
                      alt={libItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/community-gathering.jpg';
                      }}
                    />
                  </div>
                  <div className="p-2 bg-white flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{libItem.name}</span>
                    <Plus className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Done Adding Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
