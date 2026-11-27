import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  Crop, 
  Maximize2, 
  Check, 
  RefreshCw, 
  Image as ImageIcon,
  Move,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Upload,
  FolderOpen,
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const ASPECT_PRESETS = [
  { id: 'original', label: 'Full Image (No Crop)', description: 'Keep 100% original dimensions without cutting edges or leaving blank spaces' },
  { id: 'free', label: 'Free Crop (Custom)', description: 'Drag corners and edges freely to any custom rectangle' },
  { id: '16:10', label: '16:10 Community Card', ratio: 16 / 10, description: 'Standard community circle & card ratio (fills frame)' },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9, description: 'Standard banner & widescreen hero ratio (fills frame)' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, description: 'Classic photo ratio (fills frame)' },
  { id: '1:1', label: '1:1 Square', ratio: 1, description: 'Best for badges, logos, and avatars (fills frame)' },
  { id: 'contain', label: 'Fit Whole (Padded)', description: 'Center whole graphic on a soft ambient background' }
];

const DCVC_LIBRARY_PHOTOS = [
  { id: 'crc', name: 'Community Resource Center', path: '/images/crc-building.jpg', category: 'Facilities' },
  { id: 'umbrella', name: 'Rainbow Umbrella Youth', path: '/images/youth-umbrella.jpg', category: 'Programs' },
  { id: 'shines', name: 'Diversity SHINES Clinical Room', path: '/images/shines-screening.jpg', category: 'Healthcare' },
  { id: 'community', name: 'Community Gathering & Center', path: '/images/community-gathering.jpg', category: 'Community' },
  { id: 'volunteers', name: 'DCVC Volunteer Outreach Team', path: '/images/volunteers.jpg', category: 'Volunteers' },
  { id: 'prom', name: 'Pride Prom Celebration', path: '/images/pride-prom.jpeg', category: 'Events' },
  { id: 'unicorns', name: 'Little Unicorns Family Circle', path: '/images/little-unicorns.png', category: 'Programs' },
  { id: 'coast', name: 'Ventura Coastal Promenade', path: '/images/ventura-coast.jpg', category: 'Ventura' },
  { id: 'hero', name: 'Hero Community Banner', path: '/images/hero-community.jpg', category: 'Community' },
  { id: 'botanical', name: 'Botanical Wellness & Healing', path: '/images/botanical-flyer.jpg', category: 'Wellness' }
];

function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binStr = atob(parts[1]);
    const len = binStr.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

// Convert URL to Data URL to prevent canvas tainting (CORS) when cropping existing images.
// Returns an object detailing whether the resulting image can be safely manipulated on a canvas.
async function ensureDataUrl(source) {
  if (!source || typeof source !== 'string') {
    return { dataUrl: source, isCorsSafe: false, error: 'INVALID_SOURCE' };
  }
  if (source.startsWith('data:image/')) {
    return { dataUrl: source, isCorsSafe: true, error: null };
  }

  // 1. Try direct fetch with cors
  try {
    const res = await fetch(source, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) {
        return { dataUrl, isCorsSafe: true, error: null };
      }
    }
  } catch {
    // continue to Image element fallback
  }

  // 2. Try Image element with crossOrigin anonymous and verify canvas exportability
  try {
    const result = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth || 800;
          c.height = img.naturalHeight || 600;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const exported = c.toDataURL('image/jpeg', 0.92);
          resolve({ dataUrl: exported, isCorsSafe: true, error: null });
        } catch {
          // Canvas export failed due to tainted canvas (CORS restricted)
          resolve({ dataUrl: null, isCorsSafe: false, error: 'CORS_RESTRICTED' });
        }
      };
      img.onerror = () => {
        resolve({ dataUrl: null, isCorsSafe: false, error: 'CORS_RESTRICTED' });
      };
      img.src = source;
    });
    return result;
  } catch {
    return { dataUrl: null, isCorsSafe: false, error: 'CORS_RESTRICTED' };
  }
}

export default function ImageCropperModal({ 
  imageSrc, 
  imageSource,
  src,
  initialAspect = 'original',
  onApply, 
  onCancel 
}) {
  const initialImg = imageSrc || imageSource || src;
  const normalizedInitial = typeof initialImg === 'string' ? initialImg : (initialImg?.url || initialImg?.src || null);
  const [currentSource, setCurrentSource] = useState(normalizedInitial);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [corsWarning, setCorsWarning] = useState(null);
  const modalFileInputRef = useRef(null);

  // Auto-convert image sources to safe local Data URLs to eliminate CORS export issues
  useEffect(() => {
    let isCancelled = false;
    const raw = imageSrc || imageSource || src;
    if (!raw) {
      setCurrentSource(null);
      setLoadError(false);
      setCorsWarning(null);
      return;
    }
    const targetSource = typeof raw === 'string' ? raw : (raw?.url || raw?.src || null);
    if (!targetSource) {
      setCurrentSource(null);
      setLoadError(false);
      setCorsWarning(null);
      return;
    }
    setLoadError(false);
    setCorsWarning(null);

    if (typeof targetSource === 'string' && targetSource.startsWith('data:image/')) {
      setCurrentSource(targetSource);
      return;
    }

    // Set immediate preview so image is visible without delay
    setCurrentSource(targetSource);

    ensureDataUrl(targetSource).then((res) => {
      if (isCancelled) return;
      if (res && res.isCorsSafe && res.dataUrl) {
        setCurrentSource(res.dataUrl);
        setCorsWarning(null);
      } else if (res && !res.isCorsSafe) {
        setCorsWarning('This remote image is hosted on an external server that does not permit client-side canvas manipulation (CORS). Upload a local file to crop or keep original uncropped.');
      }
    }).catch(() => {
      if (!isCancelled) {
        setCorsWarning('Unable to verify image CORS headers for canvas editing.');
      }
    });

    return () => { isCancelled = true; };
  }, [imageSrc, imageSource, src]);

  const [selectedPreset, setSelectedPreset] = useState(initialAspect);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1); // 0.4x (zoom out) to 3.0x (zoom in)
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, naturalRatio: 1 });

  // Normalized crop rectangle: values from 0.0 to 1.0 relative to stage
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 1, height: 1 });
  
  // Dragging state
  const [activeDrag, setActiveDrag] = useState(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, crop: { x: 0, y: 0, width: 1, height: 1 } });
  const hasInitializedPresetRef = useRef(false);

  const imageRef = useRef(null);
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    hasInitializedPresetRef.current = false;
    setZoom(1);
    setRotation(0);
    setSelectedPreset(initialAspect || 'original');
  }, [imageSrc, imageSource, src, initialAspect]);

  const handleModalFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentSource(reader.result);
      setRotation(0);
    };
    reader.readAsDataURL(file);
    if (modalFileInputRef.current) modalFileInputRef.current.value = '';
  };

  const handleSelectLibraryPhoto = async (photoPath) => {
    setShowLibraryModal(false);
    const dataUrl = await ensureDataUrl(photoPath);
    setCurrentSource(dataUrl);
    setRotation(0);
  };

  // Load natural image dimensions
  useEffect(() => {
    if (!currentSource) return;
    const img = new Image();
    if (typeof currentSource === 'string' && (currentSource.startsWith('http://') || currentSource.startsWith('https://')) && typeof window !== 'undefined' && !currentSource.startsWith(window.location.origin)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setImageMeta({ width: w, height: h, naturalRatio: w / h });
    };
    img.onerror = () => {
      if (img.crossOrigin) {
        img.crossOrigin = null;
        img.src = currentSource;
      }
    };
    img.src = currentSource;
  }, [currentSource]);

  // Set initial crop based on preset
  const applyPreset = useCallback((presetId) => {
    setSelectedPreset(presetId);
    if (!imageMeta.width || !imageMeta.height) return;

    if (presetId === 'original' || presetId === 'contain') {
      setCrop({ x: 0, y: 0, width: 1, height: 1 });
      return;
    }

    if (presetId === 'free') {
      // Inset slightly to give user visible handles to grab immediately
      setCrop(prev => {
        if (prev.width === 1 && prev.height === 1) {
          return { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
        }
        return prev;
      });
      return;
    }

    const preset = ASPECT_PRESETS.find(p => p.id === presetId);
    if (!preset || !preset.ratio) return;

    const targetRatio = preset.ratio;
    const currentRatio = imageMeta.naturalRatio || 1;

    let newW = 1;
    let newH = 1;

    if (currentRatio > targetRatio) {
      // Image is wider than target ratio
      newW = targetRatio / currentRatio;
      newH = 1;
    } else {
      // Image is taller than target ratio
      newW = 1;
      newH = currentRatio / targetRatio;
    }

    // Center the crop box
    const newX = (1 - newW) / 2;
    const newY = (1 - newH) / 2;

    setCrop({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      width: Math.min(1, newW),
      height: Math.min(1, newH)
    });
  }, [imageMeta]);

  // Initialize crop preset once when image first loads (never overwrite user-chosen preset)
  useEffect(() => {
    if (imageMeta.width > 0 && !hasInitializedPresetRef.current) {
      hasInitializedPresetRef.current = true;
      applyPreset(initialAspect || 'original');
    }
  }, [imageMeta.width, imageMeta.height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse / Touch handlers for interactive crop box
  const handlePointerDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleType !== 'move' && selectedPreset === 'original') {
      setSelectedPreset('free');
    }
    setActiveDrag(handleType);
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      crop: { ...crop }
    };
  };

  const handlePointerMove = useCallback((e) => {
    const targetStage = stageRef.current || imageRef.current;
    if (!activeDrag || !targetStage) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

    const imgRect = targetStage.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height) return;

    const dx = (clientX - dragStartRef.current.mouseX) / imgRect.width;
    const dy = (clientY - dragStartRef.current.mouseY) / imgRect.height;
    const start = dragStartRef.current.crop;

    const minSize = 0.05; // 5% minimum crop box size

    if (activeDrag === 'move') {
      const nextX = Math.max(0, Math.min(1 - start.width, start.x + dx));
      const nextY = Math.max(0, Math.min(1 - start.height, start.y + dy));
      setCrop(prev => ({ ...prev, x: nextX, y: nextY }));
      return;
    }

    // Handle corner/edge resizing
    let newX = start.x;
    let newY = start.y;
    let newW = start.width;
    let newH = start.height;

    // Right / East
    if (activeDrag.includes('e')) {
      newW = Math.max(minSize, Math.min(1 - start.x, start.width + dx));
    }
    // Left / West
    if (activeDrag.includes('w')) {
      const maxW = start.x + start.width;
      newW = Math.max(minSize, Math.min(maxW, start.width - dx));
      newX = start.x + (start.width - newW);
    }
    // Bottom / South
    if (activeDrag.includes('s')) {
      newH = Math.max(minSize, Math.min(1 - start.y, start.height + dy));
    }
    // Top / North
    if (activeDrag.includes('n')) {
      const maxH = start.y + start.height;
      newH = Math.max(minSize, Math.min(maxH, start.height - dy));
      newY = start.y + (start.height - newH);
    }

    // If locked to a ratio preset (not 'free' and not 'original')
    const preset = ASPECT_PRESETS.find(p => p.id === selectedPreset);
    if (preset && preset.ratio && imageMeta.naturalRatio) {
      const targetRatio = preset.ratio;
      const naturalRatio = imageMeta.naturalRatio;
      const rightEdge = start.x + start.width;
      const bottomEdge = start.y + start.height;

      let constrainedH = (newW * naturalRatio) / targetRatio;
      if (activeDrag.includes('n')) {
        if (bottomEdge - constrainedH >= 0) {
          newH = constrainedH;
          newY = bottomEdge - newH;
        } else {
          newH = bottomEdge;
          newY = 0;
          newW = (newH * targetRatio) / naturalRatio;
          if (activeDrag.includes('w')) {
            newX = Math.max(0, rightEdge - newW);
          }
        }
      } else {
        if (newY + constrainedH <= 1) {
          newH = constrainedH;
        } else {
          newH = 1 - newY;
          newW = (newH * targetRatio) / naturalRatio;
          if (activeDrag.includes('w')) {
            newX = Math.max(0, rightEdge - newW);
          }
        }
      }
    }

    setCrop({
      x: Math.max(0, Math.min(1 - minSize, newX)),
      y: Math.max(0, Math.min(1 - minSize, newY)),
      width: Math.min(1 - Math.max(0, newX), Math.max(minSize, newW)),
      height: Math.min(1 - Math.max(0, newY), Math.max(minSize, newH))
    });
  }, [activeDrag, selectedPreset, imageMeta]);

  const handlePointerUp = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeDrag, handlePointerMove, handlePointerUp]);

  // Reset to 100% full original image
  const handleResetToFull = () => {
    setSelectedPreset('original');
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setRotation(0);
    setZoom(1);
  };

  // Perform Crop & Render on Canvas
  const handleApplyCrop = async () => {
    if (!currentSource) {
      alert('Please choose or upload an image to crop.');
      return;
    }

    setIsProcessing(true);

    try {
      const img = new Image();
      if (typeof currentSource === 'string' && (currentSource.startsWith('http://') || currentSource.startsWith('https://')) && typeof window !== 'undefined' && !currentSource.startsWith(window.location.origin)) {
        img.crossOrigin = 'anonymous';
      }

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          if (img.crossOrigin) {
            img.crossOrigin = null;
            img.onload = resolve;
            img.onerror = () => reject(new Error('Failed to load image for cropping.'));
            img.src = currentSource;
          } else {
            reject(new Error('Failed to load image for cropping.'));
          }
        };
        img.src = currentSource;
      });

      const natW = img.naturalWidth || 800;
      const natH = img.naturalHeight || 600;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 1. FULL ORIGINAL MODE (Zero Cropping - 100% Untouched)
      const isFullUntouchedBox = crop.x <= 0.001 && crop.y <= 0.001 && crop.width >= 0.999 && crop.height >= 0.999;
      const isZoomed = Math.abs((zoom || 1) - 1) > 0.01;
      if (selectedPreset === 'original' && rotation === 0 && isFullUntouchedBox && !isZoomed) {
        let outW = natW;
        let outH = natH;
        const maxDim = 1600;
        if (outW > maxDim || outH > maxDim) {
          if (outW > outH) {
            outH = Math.round((outH * maxDim) / outW);
            outW = maxDim;
          } else {
            outW = Math.round((outW * maxDim) / outH);
            outH = maxDim;
          }
        }
        canvas.width = outW;
        canvas.height = outH;
        ctx.drawImage(img, 0, 0, outW, outH);
      } 
      // 2. CONTAIN PADDED MODE (With Ambient Soft Reflection - Zero White Blank Space)
      else if (selectedPreset === 'contain') {
        const outW = 1200;
        const outH = 675; // 16:9 banner canvas
        canvas.width = outW;
        canvas.height = outH;

        // Draw soft ambient backdrop of image itself so NO white void is created
        ctx.save();
        ctx.drawImage(img, 0, 0, outW, outH);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(0, 0, outW, outH);
        ctx.restore();

        const pad = 20;
        const availW = outW - pad * 2;
        const availH = outH - pad * 2;
        const imgRatio = natW / natH;

        let drawW, drawH;
        if (imgRatio > (availW / availH)) {
          drawW = availW;
          drawH = Math.round(availW / imgRatio);
        } else {
          drawH = availH;
          drawW = Math.round(availH * imgRatio);
        }

        ctx.save();
        ctx.translate(outW / 2, outH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
      // 3. FREE CROP, ZOOMED, OR PRESET RATIO CROP
      else {
        const safeZoom = Math.max(0.25, zoom || 1);
        const imgLeft = 0.5 + (crop.x - 0.5) / safeZoom;
        const imgTop = 0.5 + (crop.y - 0.5) / safeZoom;
        const imgW = crop.width / safeZoom;
        const imgH = crop.height / safeZoom;

        // Determine output resolution (max 1600px dimension)
        let outW = Math.max(10, Math.round(imgW * natW));
        let outH = Math.max(10, Math.round(imgH * natH));
        const maxDim = 1600;
        if (outW > maxDim || outH > maxDim) {
          if (outW > outH) {
            outH = Math.round((outH * maxDim) / outW);
            outW = maxDim;
          } else {
            outW = Math.round((outW * maxDim) / outH);
            outH = maxDim;
          }
        }

        // Account for 90 / 270 deg rotations
        const isPerpendicular = rotation === 90 || rotation === 270;
        canvas.width = isPerpendicular ? outH : outW;
        canvas.height = isPerpendicular ? outW : outH;

        // If zoomed out beyond image bounds, draw soft ambient backdrop so edges look clean
        const hasOutOfBounds = imgLeft < 0 || imgTop < 0 || (imgLeft + imgW) > 1 || (imgTop + imgH) > 1;
        if (hasOutOfBounds) {
          ctx.save();
          ctx.filter = 'blur(18px)';
          ctx.drawImage(img, -20, -20, canvas.width + 40, canvas.height + 40);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        const sx = Math.max(0, imgLeft * natW);
        const sy = Math.max(0, imgTop * natH);
        const ex = Math.min(natW, (imgLeft + imgW) * natW);
        const ey = Math.min(natH, (imgTop + imgH) * natH);
        const sw = Math.max(1, ex - sx);
        const sh = Math.max(1, ey - sy);

        const dx = ((sx / natW - imgLeft) / imgW) * outW - outW / 2;
        const dy = ((sy / natH - imgTop) / imgH) * outH - outH / 2;
        const dw = ((sw / natW) / imgW) * outW;
        const dh = ((sh / natH) / imgH) * outH;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      }

      // Convert canvas to File & Object URL with resilient fallback
      const finalizeOutput = (blob) => {
        let finalBlob = blob;
        let dataUrlFallback = '';
        if (!finalBlob) {
          try {
            dataUrlFallback = canvas.toDataURL('image/jpeg', 0.88);
            finalBlob = dataUrlToBlob(dataUrlFallback);
          } catch (e) {
            console.warn('[ImageCropper] Canvas export fallback:', e);
          }
        }

        const filename = `framed-photo-${Date.now().toString(36)}.jpg`;
        const file = finalBlob ? new File([finalBlob], filename, { type: 'image/jpeg' }) : null;
        let previewUrl = '';
        try {
          if (finalBlob) {
            previewUrl = URL.createObjectURL(finalBlob);
          } else if (dataUrlFallback) {
            previewUrl = dataUrlFallback;
          } else {
            previewUrl = currentSource;
          }
        } catch {
          previewUrl = currentSource;
        }

        setIsProcessing(false);
        if (onApply) onApply(file, previewUrl);
      };

      try {
        canvas.toBlob((blob) => {
          finalizeOutput(blob);
        }, 'image/jpeg', 0.90);
      } catch (blobErr) {
        console.warn('[ImageCropper] toBlob notice, trying dataUrl:', blobErr);
        try {
          const fallbackData = canvas.toDataURL('image/jpeg', 0.90);
          finalizeOutput(dataUrlToBlob(fallbackData));
        } catch {
          setIsProcessing(false);
          alert('Cannot crop this image: This remote image is CORS-restricted by its host. Please upload a local image file directly to crop it.');
          return;
        }
      }

    } catch (err) {
      console.error('[ImageCropper] Error applying crop:', err);
      setIsProcessing(false);
      alert('Unable to process crop: ' + err.message + '\n\nPlease upload the image file directly from your computer.');
    }
  };

  // Live pixel coordinates of the crop selection
  const liveCropPixelW = Math.round((crop.width || 1) * (imageMeta.width || 800));
  const liveCropPixelH = Math.round((crop.height || 1) * (imageMeta.height || 600));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-200/80 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5A1E65] text-white flex items-center justify-center shadow-md">
              <Crop className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-slate-900 text-base sm:text-lg">Image Cropping & Framing Studio</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Free Crop Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Drag corners or sides to crop freely · Preserves 100% full image unless explicitly cropped
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Bar */}
        <div className="px-5 py-2.5 bg-purple-50/70 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider mr-1">
              Framing Mode:
            </span>
            {ASPECT_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  title={preset.description}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#5A1E65] text-white shadow-xs scale-102'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100/50'
                  }`}
                >
                  {preset.id === 'original' && <Maximize2 className="w-3 h-3 text-emerald-400" />}
                  {preset.id === 'free' && <Crop className="w-3 h-3 text-amber-300" />}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => modalFileInputRef.current?.click()}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 py-1 px-2.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Upload from computer"
            >
              <Upload className="w-3 h-3 text-purple-700" />
              <span>{currentSource ? 'Change Image' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 py-1 px-2.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Choose from official DCVC photo library"
            >
              <FolderOpen className="w-3 h-3 text-amber-600" />
              <span>Photo Library</span>
            </button>

            <button
              type="button"
              onClick={handleResetToFull}
              className="text-[11px] font-bold text-slate-600 hover:text-[#5A1E65] flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-purple-100/60 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Full Image</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div 
          ref={containerRef}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer?.files?.[0];
            if (file && file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = () => {
                setCurrentSource(reader.result);
                setRotation(0);
                setCorsWarning(null);
                setLoadError(false);
              };
              reader.readAsDataURL(file);
            }
          }}
          className="p-4 sm:p-6 bg-slate-950/95 flex-grow flex items-center justify-center overflow-hidden relative min-h-[360px] max-h-[55vh]"
        >
          {/* CORS Warning Banner if remote image origin forbids canvas extraction */}
          {corsWarning && (
            <div className="absolute top-3 left-3 right-3 z-30 p-2.5 rounded-xl bg-amber-950/90 text-amber-200 border border-amber-500/50 text-xs flex items-center justify-between gap-2 backdrop-blur-md shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{corsWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-amber-300 cursor-pointer"
              >
                Upload Local File
              </button>
            </div>
          )}
          <input
            ref={modalFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleModalFileSelect}
            className="hidden"
          />

          {currentSource && !loadError ? (
            <div ref={stageRef} className="relative inline-block max-w-full max-h-full select-none overflow-hidden rounded-lg bg-slate-900">
              
              {/* Ambient backdrop visible when zoomed out (< 1x) */}
              {zoom < 0.99 && (
                <img
                  src={currentSource}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-45 scale-125 pointer-events-none select-none"
                />
              )}

              {/* Underlying Image */}
              <img
                ref={imageRef}
                src={currentSource}
                alt="Crop Target"
                draggable={false}
                onError={() => {
                  setLoadError(true);
                }}
                className="max-h-[50vh] max-w-[85vw] sm:max-w-[700px] object-contain rounded-lg block pointer-events-none select-none relative z-0"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.12s ease'
                }}
              />

              {/* Interactive Crop Box Overlay (Active in free and preset modes) */}
              {selectedPreset !== 'contain' && (
                <div
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                    border: '2px solid #F59E0B',
                    borderRadius: '4px'
                  }}
                  onMouseDown={(e) => handlePointerDown(e, 'move')}
                  onTouchStart={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule-of-Thirds Grid */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div className="border-r border-b border-white/40" />
                    <div />
                  </div>

                  {/* Move Helper Badge */}
                  <div className="absolute top-2 left-2 z-20 pointer-events-none bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1 shadow-md">
                    <Move className="w-3 h-3 text-amber-300" />
                    <span>
                      {selectedPreset === 'original' 
                        ? '100% Full Image (No Cut)' 
                        : `${liveCropPixelW} × ${liveCropPixelH} px`}
                    </span>
                  </div>

                  {/* Corner Handles (Large & Easy to Drag) */}
                  {/* Top-Left */}
                  <div
                    className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-[#5A1E65] rounded-full shadow-md cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handlePointerDown(e, 'nw')}
                    onTouchStart={(e) => handlePointerDown(e, 'nw')}
                  />
                  {/* Top-Right */}
                  <div
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-[#5A1E65] rounded-full shadow-md cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handlePointerDown(e, 'ne')}
                    onTouchStart={(e) => handlePointerDown(e, 'ne')}
                  />
                  {/* Bottom-Left */}
                  <div
                    className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-[#5A1E65] rounded-full shadow-md cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handlePointerDown(e, 'sw')}
                    onTouchStart={(e) => handlePointerDown(e, 'sw')}
                  />
                  {/* Bottom-Right */}
                  <div
                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-[#5A1E65] rounded-full shadow-md cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                    onMouseDown={(e) => handlePointerDown(e, 'se')}
                    onTouchStart={(e) => handlePointerDown(e, 'se')}
                  />

                  {/* Edge Handles for Free Crop */}
                  {selectedPreset === 'free' && (
                    <>
                      {/* Top Edge */}
                      <div
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-amber-400 border border-slate-900 rounded-full shadow-md cursor-ns-resize z-30 hover:scale-115 transition-transform"
                        onMouseDown={(e) => handlePointerDown(e, 'n')}
                        onTouchStart={(e) => handlePointerDown(e, 'n')}
                      />
                      {/* Bottom Edge */}
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-amber-400 border border-slate-900 rounded-full shadow-md cursor-ns-resize z-30 hover:scale-115 transition-transform"
                        onMouseDown={(e) => handlePointerDown(e, 's')}
                        onTouchStart={(e) => handlePointerDown(e, 's')}
                      />
                      {/* Left Edge */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -left-2 w-3.5 h-8 bg-amber-400 border border-slate-900 rounded-full shadow-md cursor-ew-resize z-30 hover:scale-115 transition-transform"
                        onMouseDown={(e) => handlePointerDown(e, 'w')}
                        onTouchStart={(e) => handlePointerDown(e, 'w')}
                      />
                      {/* Right Edge */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-2 w-3.5 h-8 bg-amber-400 border border-slate-900 rounded-full shadow-md cursor-ew-resize z-30 hover:scale-115 transition-transform"
                        onMouseDown={(e) => handlePointerDown(e, 'e')}
                        onTouchStart={(e) => handlePointerDown(e, 'e')}
                      />
                    </>
                  )}

                </div>
              )}

              {/* Contain Mode Instruction */}
              {selectedPreset === 'contain' && (
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg pointer-events-none flex items-center justify-center bg-black/30">
                  <span className="bg-emerald-950/90 text-emerald-200 border border-emerald-400/40 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                    ✓ Full Image Preserved · Soft Ambient Edge Fill (Zero Blank Cut-Off)
                  </span>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-purple-300 border border-white/20 shadow-lg">
                <ImageIcon className="w-8 h-8 text-purple-300" />
              </div>
              <div className="space-y-1">
                <span className="text-white text-base block font-bold">No image to display</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Upload an image from your computer, choose from the DCVC Photo Library, or pick a default photo.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5A1E65] to-purple-700 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 hover:scale-105"
                >
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>Upload from Computer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 hover:scale-105"
                >
                  <FolderOpen className="w-4 h-4 text-amber-300" />
                  <span>Choose from Library</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3.5">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Rotation & Zoom Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Rotate:</span>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-purple-700" />
                  <span>+90°</span>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Zoom:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPreset === 'original') setSelectedPreset('free');
                    setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(2))));
                  }}
                  title="Zoom Out (fit more of image inside frame)"
                  className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-800 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => {
                    if (selectedPreset === 'original') setSelectedPreset('free');
                    setZoom(parseFloat(e.target.value));
                  }}
                  aria-label="Zoom level"
                  className="w-24 sm:w-28 accent-[#5A1E65] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPreset === 'original') setSelectedPreset('free');
                    setZoom(z => Math.min(3.0, Number((z + 0.1).toFixed(2))));
                  }}
                  title="Zoom In"
                  className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-800 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom to 100%"
                  className="text-[11px] font-mono font-bold text-slate-700 hover:text-[#5A1E65] px-1.5 py-0.5 rounded bg-white border border-slate-200 cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
              </div>
            </div>

            {/* Live Dimension & Mode Indicator */}
            <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {selectedPreset === 'original' 
                  ? 'No Crop: 100% Original Frame' 
                  : selectedPreset === 'free'
                  ? `Free Crop: ${liveCropPixelW} × ${liveCropPixelH} px (Drag Any Handle)`
                  : `${selectedPreset} Locked Crop`}
              </span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Zero random cropping: If ratio is not selected, full image is saved untouched.
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing || !currentSource || loadError}
                className={`py-2.5 px-6 rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 ${
                  !currentSource || loadError
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                    : 'btn-primary cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Image...</span>
                  </>
                ) : !currentSource || loadError ? (
                  <span>Choose or Upload Image First</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>
                      {selectedPreset === 'original' ? 'Save Full Image (No Crop)' : 'Apply Crop & Save'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* DCVC Photo Library Picker Modal Overlay */}
        {showLibraryModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#5A1E65]" />
                  <span className="font-display font-black text-slate-900 text-sm">DCVC Authentic Photography Library</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(false)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DCVC_LIBRARY_PHOTOS.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleSelectLibraryPhoto(photo.path)}
                    className="group flex flex-col rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-[#5A1E65] transition-all text-left bg-slate-50 cursor-pointer hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                      <img
                        src={photo.path}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                        {photo.category}
                      </span>
                    </div>
                    <div className="p-2">
                      <span className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#5A1E65]">
                        {photo.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
