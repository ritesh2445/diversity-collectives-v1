import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X, 
  Maximize2, 
  Sliders, 
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Sun
} from 'lucide-react';

const ASPECT_PRESETS = [
  { id: '16:9', label: '16:9 Widescreen', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3 },
  { id: '1:1', label: '1:1 Square (Logos)', ratio: 1 },
  { id: 'contain', label: 'Fit Whole Image (No Crop)', ratio: null },
  { id: 'free', label: 'Original Ratio', ratio: 0 }
];

/**
 * Interactive Client-Side Image Crop & Adjustment Studio
 * Allows admins to:
 * - Zoom (1x to 3x)
 * - Pan & Position with drag or nudge controls
 * - Rotate (90° steps)
 * - Choose Aspect Ratio (16:9, 4:3, 1:1 Square, Fit Whole Contain)
 * - Preview crop in real-time
 * - Render and export to optimized web-ready File
 */
export default function ImageCropperModal({ 
  imageSrc, 
  initialAspect = '16:9',
  onApply, 
  onCancel 
}) {
  const [selectedPreset, setSelectedPreset] = useState(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, naturalRatio: 1 });
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Compute active target aspect ratio
  const getActiveRatio = useCallback(() => {
    if (selectedPreset === 'contain') return 16 / 9; // preview frame container
    if (selectedPreset === 'free') return imageMeta.naturalRatio || (16 / 9);
    const found = ASPECT_PRESETS.find(p => p.id === selectedPreset);
    return found?.ratio || (16 / 9);
  }, [selectedPreset, imageMeta]);

  // Mouse / Touch Dragging to Pan Image
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset Adjustments
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Perform Final Crop & Render on Canvas
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const targetRatio = getActiveRatio();
      
      // Determine canvas resolution based on target aspect
      let outWidth = 1200;
      let outHeight = Math.round(outWidth / targetRatio);

      if (selectedPreset === '1:1') {
        outWidth = 800;
        outHeight = 800;
      } else if (selectedPreset === 'contain') {
        outWidth = 1200;
        outHeight = 675; // 16:9 contain canvas
      }

      canvas.width = outWidth;
      canvas.height = outHeight;

      // Fill canvas background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, outWidth, outHeight);

      ctx.save();
      ctx.translate(outWidth / 2, outHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      if (selectedPreset === 'contain') {
        // Mode: Fit Whole Image without cropping any edges
        // Compute best fit within canvas with comfortable padding
        const pad = 40;
        const availW = outWidth - pad * 2;
        const availH = outHeight - pad * 2;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        
        let drawW, drawH;
        if (imgRatio > (availW / availH)) {
          drawW = availW * zoom;
          drawH = (availW / imgRatio) * zoom;
        } else {
          drawH = availH * zoom;
          drawW = (availH * imgRatio) * zoom;
        }

        ctx.drawImage(img, -drawW / 2 + pan.x, -drawH / 2 + pan.y, drawW, drawH);
      } else {
        // Mode: Crop / Fill frame
        const scaleBase = Math.max(outWidth / img.naturalWidth, outHeight / img.naturalHeight);
        const finalScale = scaleBase * zoom;
        const drawW = img.naturalWidth * finalScale;
        const drawH = img.naturalHeight * finalScale;

        ctx.drawImage(img, -drawW / 2 + pan.x, -drawH / 2 + pan.y, drawW, drawH);
      }

      ctx.restore();

      // Convert canvas to blob & File
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate cropped image.');
          setIsProcessing(false);
          return;
        }

        const croppedFile = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const localPreviewUrl = URL.createObjectURL(blob);

        onApply(croppedFile, localPreviewUrl);
        setIsProcessing(false);
      }, 'image/jpeg', 0.92);

    } catch (err) {
      alert('Error cropping image: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A1E65] text-white flex items-center justify-center shadow-xs">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-950 text-base tracking-tight">
                Image Adjustment & Crop Studio
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Drag to reposition · Zoom & rotate · Prevent awkward logo cut-offs
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

        {/* Aspect Ratio Tabs */}
        <div className="px-6 py-2.5 bg-purple-50/60 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider mr-1">
              Frame Aspect:
            </span>
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.id);
                  setPan({ x: 0, y: 0 });
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedPreset === preset.id
                    ? 'bg-[#5A1E65] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-600 hover:text-[#5A1E65] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-purple-100/50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Framing</span>
          </button>
        </div>

        {/* Main Crop Viewport */}
        <div className="p-6 bg-slate-900/95 flex-grow flex items-center justify-center overflow-hidden relative min-h-[340px]">
          
          {/* Framed Crop Box */}
          <div 
            ref={containerRef}
            className="relative overflow-hidden shadow-2xl border-2 border-amber-300 rounded-2xl flex items-center justify-center cursor-move"
            style={{
              width: '100%',
              maxWidth: '540px',
              aspectRatio: `${getActiveRatio()}`,
              backgroundColor: bgColor
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Visual Guide Grid (Rule of Thirds) */}
            <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Rendered Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Adjustment Target"
              className="max-w-none pointer-events-none select-none transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
                ...(selectedPreset === 'contain' 
                  ? { maxHeight: '82%', maxWidth: '82%', objectFit: 'contain' } 
                  : { width: '100%', height: '100%', objectFit: 'cover' })
              }}
            />

            {/* Instruction Badge */}
            <div className="absolute bottom-2 left-2 z-30 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none flex items-center gap-1 border border-white/20">
              <Move className="w-3 h-3 text-amber-300" />
              <span>Click & Drag to reposition</span>
            </div>
          </div>

        </div>

        {/* Toolbar Controls */}
        <div className="p-5 bg-white border-t border-slate-200 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            {/* Zoom Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#5A1E65]" />
                  <span>Zoom / Scale</span>
                </span>
                <span className="text-[#5A1E65]">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}
                  className="p-1 rounded-md border border-slate-200 hover:bg-slate-100"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#5A1E65] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
                  className="p-1 rounded-md border border-slate-200 hover:bg-slate-100"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Rotate Controls */}
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-700">Rotate Orientation</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-purple-700" />
                  <span>+90°</span>
                </button>
              </div>
            </div>

            {/* Background Canvas Tint (For Contain mode) */}
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-700">Canvas Fill Tint</span>
              <div className="flex items-center gap-2">
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
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                      bgColor === bg.color ? 'border-[#5A1E65] scale-110 shadow-xs' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: bg.color }}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Produces high-resolution, web-optimized JPEG with zero distortion.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
                    <span>Processing Crop...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Apply Adjusted Crop</span>
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

