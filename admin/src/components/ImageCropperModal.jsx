import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, 
  RotateCw, 
  RotateCcw, 
  Check, 
  X, 
  Maximize2, 
  Image as ImageIcon,
  RefreshCw,
  Move,
  Minimize2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const ASPECT_PRESETS = [
  { id: 'original', label: 'Full Image (No Crop)', description: 'Keep 100% original dimensions without cutting edges' },
  { id: 'free', label: 'Free Crop (Custom)', description: 'Drag corners and edges freely to any custom rectangle' },
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9, description: 'Standard banner & widescreen hero ratio' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, description: 'Classic photo ratio' },
  { id: '1:1', label: '1:1 Square', ratio: 1, description: 'Best for badges, logos, and avatars' },
  { id: 'contain', label: 'Fit Whole (Padded)', description: 'Center whole graphic on a clean tinted background' }
];

export default function ImageCropperModal({ 
  imageSrc, 
  initialAspect = 'original',
  onApply, 
  onCancel 
}) {
  const [selectedPreset, setSelectedPreset] = useState(initialAspect);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, naturalRatio: 1 });

  // Normalized crop rectangle: values from 0.0 to 1.0 relative to displayed image
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 1, height: 1 });
  
  // Dragging state
  const [activeDrag, setActiveDrag] = useState(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, crop: { x: 0, y: 0, width: 1, height: 1 } });

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Load natural image dimensions
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setImageMeta({ width: w, height: h, naturalRatio: w / h });
    };
  }, [imageSrc]);

  // Set initial crop based on preset
  const applyPreset = useCallback((presetId) => {
    setSelectedPreset(presetId);
    if (!imageMeta.width || !imageMeta.height) return;

    if (presetId === 'original' || presetId === 'contain') {
      setCrop({ x: 0, y: 0, width: 1, height: 1 });
      return;
    }

    if (presetId === 'free') {
      // If currently 100%, inset slightly to give user visible handles to grab immediately
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

  // Synchronize when image loads or preset changes
  useEffect(() => {
    if (imageMeta.width > 0) {
      applyPreset(initialAspect || 'original');
    }
  }, [imageMeta.width, imageMeta.height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse / Touch handlers for interactive crop box
  const handlePointerDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (!activeDrag || !imageRef.current) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

    const imgRect = imageRef.current.getBoundingClientRect();
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
      // Locked aspect ratio: targetRatio = (cropPixelW / cropPixelH)
      // cropPixelW = newW * naturalWidth, cropPixelH = newH * naturalHeight
      const targetRatio = preset.ratio;
      const naturalRatio = imageMeta.naturalRatio;
      
      // Compute required height given width
      const constrainedH = (newW * naturalRatio) / targetRatio;
      if (newY + constrainedH <= 1) {
        newH = constrainedH;
      } else {
        newH = 1 - newY;
        newW = (newH * targetRatio) / naturalRatio;
      }
    }

    setCrop({
      x: Math.max(0, Math.min(1 - minSize, newX)),
      y: Math.max(0, Math.min(1 - minSize, newY)),
      width: Math.max(minSize, Math.min(1 - newX, newW)),
      height: Math.max(minSize, Math.min(1 - newY, newH))
    });
  }, [activeDrag, selectedPreset, imageMeta]);

  const handlePointerUp = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [activeDrag, handlePointerMove, handlePointerUp]);

  // Reset to 100% full original image
  const handleResetToFull = () => {
    setSelectedPreset('original');
    setRotation(0);
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  // Perform Crop & Render on Canvas
  const handleApplyCrop = async () => {
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const natW = img.naturalWidth || 800;
      const natH = img.naturalHeight || 600;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 1. FULL ORIGINAL MODE (Zero Cropping - 100% Untouched)
      if (selectedPreset === 'original' && rotation === 0) {
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
      // 2. CONTAIN PADDED MODE
      else if (selectedPreset === 'contain') {
        const outW = 1200;
        const outH = 675; // 16:9 padded canvas
        canvas.width = outW;
        canvas.height = outH;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outW, outH);

        const pad = 30;
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
      // 3. FREE CROP OR PRESET RATIO CROP
      else {
        // Calculate exact pixel source coordinates from normalized crop box
        const sourceX = Math.max(0, Math.round(crop.x * natW));
        const sourceY = Math.max(0, Math.round(crop.y * natH));
        const sourceW = Math.min(natW - sourceX, Math.max(10, Math.round(crop.width * natW)));
        const sourceH = Math.min(natH - sourceY, Math.max(10, Math.round(crop.height * natH)));

        // Determine output resolution (max 1600px dimension)
        let outW = sourceW;
        let outH = sourceH;
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

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, -outW / 2, -outH / 2, outW, outH);
        ctx.restore();
      }

      // Convert canvas to File & Object URL
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate image from canvas.');
          setIsProcessing(false);
          return;
        }

        const croppedFile = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const localPreviewUrl = URL.createObjectURL(blob);

        onApply(croppedFile, localPreviewUrl);
        setIsProcessing(false);
      }, 'image/jpeg', 0.92);

    } catch (err) {
      alert('Error processing image crop: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Compute live pixel dimensions of the crop for admin visibility
  const liveCropPixelW = Math.round(crop.width * (imageMeta.width || 1));
  const liveCropPixelH = Math.round(crop.height * (imageMeta.height || 1));

  return (
    <div 
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150 font-sans">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A1E65] text-white flex items-center justify-center shadow-xs">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-950 text-sm sm:text-base tracking-tight flex items-center gap-2">
                <span>Image Cropping & Framing Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5A1E65]">
                  Free Crop Enabled
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Drag corners or sides to crop freely · Preserves 100% full image unless explicitly cropped
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
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

          <button
            type="button"
            onClick={handleResetToFull}
            className="text-[11px] font-bold text-slate-600 hover:text-[#5A1E65] flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-purple-100/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Full Image</span>
          </button>
        </div>

        {/* Viewport Area */}
        <div 
          ref={containerRef}
          className="p-4 sm:p-6 bg-slate-950/95 flex-grow flex items-center justify-center overflow-hidden relative min-h-[360px] max-h-[55vh]"
        >
          {imageSrc ? (
            <div className="relative inline-block max-w-full max-h-full select-none">
              
              {/* Underlying Image */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop Target"
                draggable={false}
                className="max-h-[50vh] max-w-[85vw] sm:max-w-[700px] object-contain rounded-lg block pointer-events-none select-none"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease'
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
                    <div className="border-r border-white/40" />
                    <div className="border-r border-white/40" />
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
                    ✓ Full Image Preserved · Centered on {bgColor} canvas with zero cut-off
                  </span>
                </div>
              )}

            </div>
          ) : (
            <div className="text-white text-xs">No image to display</div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3.5">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Rotation Controls */}
            <div className="flex items-center gap-2">
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

            {/* Tint Chooser for Contain Mode */}
            {selectedPreset === 'contain' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Canvas Fill Tint:</span>
                {[
                  { name: 'White', color: '#FFFFFF' },
                  { name: 'Soft Gray', color: '#F8FAFC' },
                  { name: 'Lavender', color: '#FAF5FF' },
                  { name: 'Dark Slate', color: '#0F172A' }
                ].map((bg) => (
                  <button
                    key={bg.color}
                    type="button"
                    title={bg.name}
                    onClick={() => setBgColor(bg.color)}
                    className={`w-6 h-6 rounded-md border-2 transition-transform cursor-pointer ${
                      bgColor === bg.color ? 'border-[#5A1E65] scale-110 shadow-xs' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: bg.color }}
                  />
                ))}
              </div>
            )}

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
                disabled={isProcessing}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Image...</span>
                  </>
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

      </div>
    </div>
  );
}
