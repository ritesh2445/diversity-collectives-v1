import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Camera,
  Layers,
  ArrowRight
} from 'lucide-react';
import { galleryPhotos } from '../data/dcvcData';
import { getOptimizedImageUrl } from '../lib/cloudinary';
import { usePageMeta } from '../utils/seo';

export default function Gallery() {
  usePageMeta({
    title: 'Community Image Gallery & Archives',
    description: 'Explore photographs celebrating Ventura County Pride, Rainbow Umbrella youth circles, volunteer outreach, and our physical Community Resource Center.',
    canonicalPath: '/gallery'
  });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'wall'

  const categories = ['All', 'Festivals & Pride', 'Youth & Community', 'Volunteers & Action', 'Sanctuary & CRC', 'Health & Wellness', 'Kids & Families'];

  const filteredPhotos = selectedCategory === 'All'
    ? galleryPhotos
    : galleryPhotos.filter(p => p.category === selectedCategory);

  // Keyboard navigation for Lightbox (Esc, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  const activePhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Header */}
      <section className="container-clean pb-14 border-b border-slate-100 relative overflow-hidden">
        <div 
          className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-2xl flex flex-col gap-4">
            <span className="glass-pill text-xs font-bold text-[#5A1E65] bg-purple-50 border-purple-200/90 shadow-xs">
              MOMENTS & MEMORIES
            </span>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
              Community <br />
              <span className="font-serif italic font-normal text-[#5A1E65]">Image Gallery.</span>
            </h1>
            <p className="font-serif italic text-xl md:text-2xl text-slate-700 leading-relaxed pt-2">
              A decade of celebration, sanctuary, grassroots mutual aid, and affirming belonging across Ventura County.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'wall' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Horizontal Wall
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pt-8 border-t border-slate-100 mt-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedPhotoIndex(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-purple-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Gallery Display */}
      <section className="container-clean py-14">
        
        {viewMode === 'wall' ? (
          /* Horizontal Scrollable Gallery Wall */
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin snap-x snap-mandatory">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="w-80 sm:w-96 flex-shrink-0 snap-center p-3 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all cursor-pointer group space-y-3"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={getOptimizedImageUrl(photo.image, { width: 640 })}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                    {photo.category} · {photo.year}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-950 mt-0.5 line-clamp-1">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Responsive Multi-Column Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="p-3 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all cursor-pointer group space-y-3"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={getOptimizedImageUrl(photo.image, { width: 640 })}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-bold">
                    {photo.category}
                  </span>
                  <span className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-950/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-display text-lg font-black text-slate-950 group-hover:text-[#5A1E65] transition-colors leading-snug">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* Accessible Full-Screen Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close image lightbox (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous image */}
          <button
            onClick={() => setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
            className="absolute left-4 sm:left-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Previous image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Lightbox Card */}
          <div className="max-w-4xl w-full max-h-[90vh] bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-700">
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black min-h-[300px] max-h-[65vh]">
              <img
                src={getOptimizedImageUrl(activePhoto.image, { width: 1200 })}
                alt={activePhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {activePhoto.category} · {activePhoto.year}
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  {activePhoto.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {activePhoto.description}
                </p>
              </div>

              <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
                {selectedPhotoIndex + 1} of {filteredPhotos.length}
              </span>
            </div>
          </div>

          {/* Next image */}
          <button
            onClick={() => setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length)}
            className="absolute right-4 sm:right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Next image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
}

