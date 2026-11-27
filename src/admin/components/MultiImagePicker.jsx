import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
  FolderOpen,
  Sparkles,
  Eye,
  Check,
  X,
  Play,
  Pause,
  ExternalLink,
  Crop
} from 'lucide-react';
import { DCVC_IMAGE_LIBRARY, uploadAndStoreImage, optimizeImageFile } from '../services/imageService.js';
import ImageCropperModal from './ImageCropperModal.jsx';
import AutoSlideImage from '../../components/AutoSlideImage.jsx';

/**
 * MultiImagePicker
 * Allows admin to attach multiple images to Programs, Events, Articles, and Milestones.
 * Features:
 * - Direct upload or crop tool with free crop & ratio presets
 * - Preset DCVC Library picker
 * - URL direct input
 * - Reorder slides (Left/Right)
 * - Designate Primary / Cover image
 * - Interactive Auto-Slide Live Preview right in the editor
 */
export default function MultiImagePicker({
  images = [],
  primaryImage = '',
  onChange,
  onPrimaryChange,
  label = 'Gallery & Rotating Images',
  helpText = 'Add multiple images to enable automatic sliding showcase across website cards and detail pages.',
  aspectRatio = 'aspect-[16/9]'
}) {
  // Normalize incoming images
  const normalizedImages = Array.isArray(images)
    ? images.filter(Boolean)
    : primaryImage
    ? [primaryImage]
    : [];

  const [showLibrary, setShowLibrary] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSource, setCropperSource] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [uploadMode, setUploadMode] = useState('crop'); // 'crop' | 'direct'
  const fileInputRef = useRef(null);

  const updateImages = (newList) => {
    onChange(newList);
    if (onPrimaryChange && newList.length > 0) {
      onPrimaryChange(newList[0]);
    }
  };

  // Add new URL to list
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const trimmed = urlInput.trim();
    if (!normalizedImages.includes(trimmed)) {
      const updated = [...normalizedImages, trimmed];
      updateImages(updated);
    }
    setUrlInput('');
    setShowUrlInput(false);
    setStatusMsg('✓ Image added to slideshow');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Select image from library
  const handleSelectFromLibrary = (url) => {
    if (!normalizedImages.includes(url)) {
      const updated = [...normalizedImages, url];
      updateImages(updated);
    }
    setShowLibrary(false);
    setStatusMsg('✓ Image added from DCVC library');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // File upload from computer
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadMode === 'direct') {
      handleDirectUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSource(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Direct upload without crop
  const handleDirectUploadFile = async (file) => {
    if (!file) return;
    try {
      setIsUploading(true);
      setStatusMsg('Optimizing & uploading photo...');
      const result = await uploadAndStoreImage(file);
      const updated = [...normalizedImages, result.url];
      updateImages(updated);
      setStatusMsg('✓ Photo uploaded and added to slideshow');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Edit existing image in the list
  const handleEditExisting = (index) => {
    const target = normalizedImages[index];
    if (!target) return;
    setEditingIndex(index);
    setCropperSource(target);
    setShowCropper(true);
  };

  // Cropper apply
  const handleCropperApply = async (croppedFile, previewUrl) => {
    setShowCropper(false);
    const targetIdx = editingIndex;
    setEditingIndex(null);
    setCropperSource(null);
    try {
      setIsUploading(true);
      setStatusMsg(targetIdx !== null ? 'Updating edited photo...' : 'Saving cropped photo...');
      const result = await uploadAndStoreImage(croppedFile || previewUrl);
      if (targetIdx !== null && targetIdx >= 0 && targetIdx < normalizedImages.length) {
        const updated = [...normalizedImages];
        updated[targetIdx] = result.url;
        updateImages(updated);
        setStatusMsg('✓ Photo updated');
      } else {
        const updated = [...normalizedImages, result.url];
        updateImages(updated);
        setStatusMsg('✓ Cropped photo added to slideshow');
      }
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      console.warn('[MultiImagePicker] Save notice:', err);
      if (previewUrl && !String(previewUrl).startsWith('blob:')) {
        if (targetIdx !== null && targetIdx >= 0 && targetIdx < normalizedImages.length) {
          const updated = [...normalizedImages];
          updated[targetIdx] = previewUrl;
          updateImages(updated);
        } else {
          updateImages([...normalizedImages, previewUrl]);
        }
      } else {
        alert('Upload failed: ' + (err?.message || 'Unable to process image'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Remove image
  const handleRemove = (index) => {
    const updated = normalizedImages.filter((_, i) => i !== index);
    updateImages(updated);
  };

  // Move image left/up
  const handleMoveLeft = (index) => {
    if (index === 0) return;
    const updated = [...normalizedImages];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    updateImages(updated);
  };

  // Move image right/down
  const handleMoveRight = (index) => {
    if (index >= normalizedImages.length - 1) return;
    const updated = [...normalizedImages];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updateImages(updated);
  };

  // Make primary cover
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const item = normalizedImages[index];
    const updated = [item, ...normalizedImages.filter((_, i) => i !== index)];
    updateImages(updated);
  };

  const defaultCropAspect = aspectRatio.includes('16/10')
    ? '16:10'
    : aspectRatio.includes('16/9')
    ? '16:9'
    : aspectRatio.includes('4/3')
    ? '4:3'
    : aspectRatio.includes('square') || aspectRatio.includes('1/1')
    ? '1:1'
    : 'original';

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
              {label}
            </label>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#5A1E65]">
              {normalizedImages.length} {normalizedImages.length === 1 ? 'Image' : 'Images'} (Auto-Slides)
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{helpText}</p>
        </div>

        {/* Live Preview Toggle Button */}
        {normalizedImages.length > 0 && (
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showLivePreview
                ? 'bg-[#5A1E65] text-white shadow-xs'
                : 'bg-white text-[#5A1E65] border border-purple-200 hover:bg-purple-100/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLivePreview ? 'Hide Auto-Slide Preview' : 'Test Auto-Slide Preview'}</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Live Auto-Slide Preview Panel */}
      {showLivePreview && normalizedImages.length > 0 && (
        <div className="p-3 bg-slate-950 rounded-2xl border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/80 pb-1 border-b border-white/10">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <Play className="w-3 h-3 fill-amber-300" />
              Live Visitor View (Cycles automatically every 3.5s)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Hover to pause • Click dots to jump
            </span>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/10">
            <AutoSlideImage
              images={normalizedImages}
              aspectRatio="aspect-[16/9]"
              interval={3500}
              imageFit="cover"
              showDots={true}
              showArrows={true}
            />
          </div>
        </div>
      )}

      {/* Image Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
        {normalizedImages.map((url, idx) => {
          const isCover = idx === 0;
          return (
            <div
              key={`${url}-${idx}`}
              className={`relative rounded-xl overflow-hidden border-2 bg-white flex flex-col group transition-all ${
                isCover ? 'border-[#5A1E65] ring-2 ring-purple-300 shadow-sm' : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className={`relative ${aspectRatio || 'aspect-[16/10]'} bg-slate-900 overflow-hidden`}>
                <img
                  src={url}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/community-gathering.jpg';
                  }}
                />
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#5A1E65] text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                    Cover
                  </span>
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-white font-mono text-[9px]">
                  #{idx + 1}
                </span>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveLeft(idx)}
                    title="Move earlier in slideshow"
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx >= normalizedImages.length - 1}
                    onClick={() => handleMoveRight(idx)}
                    title="Move later in slideshow"
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      title="Make Primary Cover Image"
                      className="p-1 rounded text-amber-600 hover:bg-amber-100 cursor-pointer font-bold"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEditExisting(idx)}
                    title="Edit & crop this photo"
                    className="p-1 rounded text-purple-700 hover:bg-purple-100 cursor-pointer font-bold"
                  >
                    <Crop className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Remove from slideshow"
                  className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Image Tile */}
        <div className="aspect-[16/10] rounded-xl border-2 border-dashed border-purple-300 bg-white/70 hover:bg-purple-50/50 hover:border-[#5A1E65] transition-all flex flex-col items-center justify-center p-3 text-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setUploadMode('crop');
                fileInputRef.current?.click();
              }}
              className="px-2 py-1 rounded-lg bg-[#5A1E65] text-white hover:bg-purple-900 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Upload from computer and crop"
            >
              <Upload className="w-3 h-3" />
              <span>Crop</span>
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setUploadMode('direct');
                fileInputRef.current?.click();
              }}
              className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Upload original image directly without crop"
            >
              <Sparkles className="w-3 h-3" />
              <span>Direct</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Pick from DCVC Center Library"
            >
              <FolderOpen className="w-3 h-3 text-purple-700" />
              <span>Library</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] font-bold text-purple-800 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>+ Add by URL</span>
          </button>
        </div>
      </div>

      {/* Direct URL Input Popup */}
      {showUrlInput && (
        <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center gap-2 animate-fadeIn">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://... or /images/your-photo.jpg"
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A1E65]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 rounded-lg bg-[#5A1E65] text-white text-xs font-bold hover:bg-purple-900 cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Library Selection Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#5A1E65]" />
                <h3 className="font-display font-black text-slate-900 text-lg">
                  Select from DCVC Photo Library
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
              {DCVC_IMAGE_LIBRARY.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => handleSelectFromLibrary(item.url)}
                  className="group rounded-xl border border-slate-200 hover:border-[#5A1E65] overflow-hidden bg-slate-50 text-left transition-all hover:shadow-md cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/10] bg-slate-900 overflow-hidden relative">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal with Free Crop & Presets */}
      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperSource || null}
          initialAspect={defaultCropAspect}
          onApply={handleCropperApply}
          onCancel={() => {
            setShowCropper(false);
            setCropperSource(null);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}
