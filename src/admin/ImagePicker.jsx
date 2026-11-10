import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  X, 
  ExternalLink,
  FolderOpen,
  Eye,
  RefreshCw,
  Crop,
  Sliders
} from 'lucide-react';
import { DCVC_IMAGE_LIBRARY, uploadAndStoreImage, optimizeImageFile } from '../services/imageService.js';
import ImageCropperModal from './ImageCropperModal.jsx';

export default function ImagePicker({ 
  value, 
  onChange, 
  label = 'Picture / Cover Image',
  aspectRatio = 'aspect-[16/9]',
  helpText = 'Upload a picture from your computer or choose from the DCVC Sanctuary library.'
}) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState('');
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSource, setCropperSource] = useState(null);
  const fileInputRef = useRef(null);

  // When user selects a file from computer, load into Cropper Studio first
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSource(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open cropper for currently selected image
  const handleOpenCropperForCurrent = () => {
    if (!value) return;
    setCropperSource(value);
    setShowCropper(true);
  };

  // Handle Cropper Apply
  const handleCropperApply = async (croppedFile, previewUrl) => {
    setShowCropper(false);
    try {
      setIsOptimizing(true);
      setOptimizeStatus('Optimizing & storing cropped image...');

      const result = await uploadAndStoreImage(croppedFile);
      onChange(result.url);

      const kbSaved = ((result.sizeBytes || 0) / 1024).toFixed(0);
      setOptimizeStatus(`✓ Cropped & saved (${kbSaved} KB)`);
      setTimeout(() => setOptimizeStatus(''), 4000);
    } catch (err) {
      alert('Failed to process cropped image: ' + err.message);
      if (previewUrl) onChange(previewUrl);
      setOptimizeStatus('');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectFromLibrary = (path) => {
    onChange(path);
    setShowLibrary(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">{label}</label>
        <button
          type="button"
          onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
          className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold cursor-pointer underline"
        >
          {showDirectUrlInput ? 'Hide URL field' : 'Edit URL directly'}
        </button>
      </div>

      {/* Main Image Preview & Drop Target */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-[#5A1E65] bg-slate-50 transition-all group">
        <div className={`w-full ${aspectRatio} relative flex items-center justify-center bg-slate-900/5`}>
          {value ? (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Defensive fallback: if relative path fails, try local placeholder
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/community-gathering.jpg';
              }}
            />
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No picture selected</p>
            </div>
          )}

          {/* Quick Action Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-purple-700" />
              <span>Upload New Picture</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="px-3 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Choose from Library</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={handleOpenCropperForCurrent}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                title="Adjust framing, zoom, or aspect ratio"
              >
                <Crop className="w-3.5 h-3.5 text-slate-950" />
                <span>Adjust & Crop</span>
              </button>
            )}
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                title="Remove Picture"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Button Row Below Preview for Mobile / Easy Access */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isOptimizing}
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" /> : <Upload className="w-3.5 h-3.5 text-purple-700" />}
          <span>{isOptimizing ? 'Optimizing...' : 'Upload Picture'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-purple-50 hover:border-purple-300 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>Select from DCVC Photos</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={handleOpenCropperForCurrent}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Crop className="w-3.5 h-3.5 text-amber-700" />
            <span>Adjust & Crop</span>
          </button>
        )}

        {optimizeStatus && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-fade-in">
            {optimizeStatus}
          </span>
        )}
      </div>

      {/* Optional Direct URL Input */}
      {showDirectUrlInput && (
        <div className="pt-2 animate-fade-in">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. /images/community-gathering.jpg or https://cdn..."
            className="w-full px-3 py-2 text-xs font-mono border rounded-xl border-slate-300 focus:outline-none focus:border-[#5A1E65] bg-white"
          />
        </div>
      )}

      {helpText && <p className="text-[11px] text-slate-500">{helpText}</p>}

      {/* DCVC Photo Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#5A1E65]" />
                  <span>DCVC Sanctuary Photo Library</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select an authentic, pre-optimized community photo to use for this item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {DCVC_IMAGE_LIBRARY.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectFromLibrary(item.path)}
                  className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-xs hover:shadow-md ${
                    value === item.path ? 'border-[#5A1E65] ring-2 ring-purple-300' : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={item.path}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/community-gathering.jpg';
                      }}
                    />
                  </div>
                  <div className="p-2 bg-white text-left">
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 block">
                      {item.category}
                    </span>
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                  </div>
                  {value === item.path && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#5A1E65] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Tip: You can also upload custom photos from your computer at any time.
              </span>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Crop & Adjustment Studio Modal */}
      {showCropper && cropperSource && (
        <ImageCropperModal
          imageSrc={cropperSource}
          initialAspect={aspectRatio.includes('16/9') ? '16:9' : aspectRatio.includes('1/1') ? '1:1' : '16:9'}
          onApply={handleCropperApply}
          onCancel={() => {
            setShowCropper(false);
            setCropperSource(null);
          }}
        />
      )}
    </div>
  );
}

