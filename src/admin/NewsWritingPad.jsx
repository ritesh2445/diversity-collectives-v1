import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Minus, 
  Code, 
  Eye, 
  Edit3, 
  RotateCcw, 
  RotateCw, 
  Palette, 
  Highlighter, 
  Type, 
  Sparkles, 
  Check, 
  X,
  ExternalLink,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import ImagePicker from './ImagePicker';

const BRAND_COLORS = [
  { name: 'Charcoal', hex: '#0F172A' },
  { name: 'DCVC Amethyst', hex: '#5A1E65' },
  { name: 'Pride Rose', hex: '#E11D48' },
  { name: 'Sunset Amber', hex: '#D97706' },
  { name: 'Sanctuary Teal', hex: '#0D9488' },
  { name: 'Sapphire Blue', hex: '#2563EB' },
  { name: 'Slate Gray', hex: '#475569' },
  { name: 'Pure Black', hex: '#000000' }
];

const HIGHLIGHT_COLORS = [
  { name: 'None', hex: 'transparent' },
  { name: 'Sunlight Yellow', hex: '#FEF08A' },
  { name: 'Lavender Mist', hex: '#F3E8FF' },
  { name: 'Mint Meadow', hex: '#D1FAE5' },
  { name: 'Blush Coral', hex: '#FFE4E6' },
  { name: 'Sky Azure', hex: '#E0F2FE' }
];

/**
 * Professional Blogspot-style News Writing Pad for DCVC CMS
 * Supports:
 * - Visual Compose mode (WYSIWYG)
 * - Raw HTML Source View (<>)
 * - Public Layout Live Preview
 * - Headings, typography, color swatches, highlights, alignment
 * - Links, media library pictures, blockquotes, callout containers, dividers
 * - Word counter, character counter, and automatic read-time estimator
 */
export default function NewsWritingPad({ 
  value = '', 
  onChange, 
  onReadTimeCalculated 
}) {
  const [viewMode, setViewMode] = useState('compose'); // 'compose' | 'html' | 'preview'
  const [htmlContent, setHtmlContent] = useState(
    Array.isArray(value) 
      ? value.map(p => `<p>${p}</p>`).join('\n') 
      : (value || '<p>Welcome to Diversity Collective Ventura County! Begin writing your story here...</p>')
  );
  
  const editorRef = useRef(null);
  const [activeHeading, setActiveHeading] = useState('p');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Link Dialog State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Image Dialog State
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlign, setImageAlign] = useState('center');

  // Stats
  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: '1 min read' });

  // Compute Word Count & Reading Time
  const calculateStats = useCallback((textOrHtml) => {
    const text = textOrHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 190));
    const readTime = `${minutes} min read`;
    
    setStats({ words, chars, readTime });
    if (onReadTimeCalculated) {
      onReadTimeCalculated(readTime);
    }
  }, [onReadTimeCalculated]);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && typeof value === 'string' && value !== htmlContent) {
      setHtmlContent(value);
      calculateStats(value);
    } else if (Array.isArray(value)) {
      const joined = value.map(p => `<p>${p}</p>`).join('\n');
      if (joined !== htmlContent) {
        setHtmlContent(joined);
        calculateStats(joined);
      }
    }
  }, [value]);

  // Sync editor innerHTML when switching back to compose mode
  useEffect(() => {
    if (viewMode === 'compose' && editorRef.current) {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [viewMode, htmlContent]);

  // Notify parent on content change
  const handleContentUpdate = (newHtml) => {
    setHtmlContent(newHtml);
    calculateStats(newHtml);
    if (onChange) {
      onChange(newHtml);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      handleContentUpdate(editorRef.current.innerHTML);
    }
  };

  // Safe execCommand helper
  const exec = (command, val = null) => {
    if (viewMode !== 'compose') return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  // Format Heading block
  const handleHeadingChange = (tag) => {
    setActiveHeading(tag);
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  // Insert Callout Box
  const insertCalloutBox = (type = 'purple') => {
    const styles = {
      purple: 'background: #FAF5FF; border-left: 4px solid #5A1E65; padding: 16px 20px; border-radius: 12px; margin: 20px 0;',
      amber: 'background: #FFFBEB; border-left: 4px solid #D97706; padding: 16px 20px; border-radius: 12px; margin: 20px 0;',
      emerald: 'background: #F0FDF4; border-left: 4px solid #0D9488; padding: 16px 20px; border-radius: 12px; margin: 20px 0;'
    };

    const calloutHtml = `
      <div style="${styles[type]}" class="news-callout-box">
        <strong style="display: block; margin-bottom: 4px; color: #0F172A;">✨ Community Highlight:</strong>
        <p style="margin: 0; color: #334155;">Type your key takeaway, program notice, or special community reflection here...</p>
      </div>
      <p><br></p>
    `;
    exec('insertHTML', calloutHtml);
  };

  // Insert Divider
  const insertHorizontalRule = () => {
    exec('insertHTML', '<hr style="border: none; border-top: 2px dashed #E2E8F0; margin: 32px 0;" /><p><br></p>');
  };

  // Handle Link Insertion
  const handleApplyLink = (e) => {
    e.preventDefault();
    if (!linkUrl) return;

    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('mailto:') 
      ? linkUrl 
      : `https://${linkUrl}`;

    const textToInsert = linkText || formattedUrl;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const linkHtml = `<a href="${formattedUrl}"${targetAttr} style="color: #5A1E65; font-weight: 700; text-decoration: underline;">${textToInsert}</a>`;

    exec('insertHTML', linkHtml);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Handle Image Insertion
  const handleApplyImage = (e) => {
    e.preventDefault();
    if (!imageUrl) return;

    let alignStyle = 'margin: 24px auto; text-align: center;';
    if (imageAlign === 'left') alignStyle = 'float: left; margin: 0 24px 20px 0; max-width: 50%;';
    if (imageAlign === 'right') alignStyle = 'float: right; margin: 0 0 20px 24px; max-width: 50%;';

    const figureHtml = `
      <figure style="${alignStyle}" class="news-embedded-image">
        <img src="${imageUrl}" alt="${imageAlt || 'DCVC News Image'}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); display: inline-block; border: 1px solid #E2E8F0;" />
        ${imageCaption ? `<figcaption style="font-size: 12px; color: #64748B; margin-top: 8px; font-style: italic;">${imageCaption}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;

    exec('insertHTML', figureHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
  };

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col font-sans">
      
      {/* Top Header: Title & View Mode Selector (Blogspot Compose vs HTML vs Preview) */}
      <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5A1E65] text-white flex items-center justify-center font-bold shadow-xs">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>DCVC Article Writing Pad</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5A1E65] border border-purple-200 uppercase tracking-wider">
                Blogspot Studio
              </span>
            </h4>
          </div>
        </div>

        {/* View Modes */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setViewMode('compose')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'compose'
                ? 'bg-[#5A1E65] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Compose</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('html')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'html'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML (&lt;&gt;)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'preview'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Blogspot Toolbar (Visible in Compose Mode) */}
      {viewMode === 'compose' && (
        <div className="bg-white px-3 py-2 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-700 select-none">
          
          {/* Undo / Redo */}
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => exec('undo')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => exec('redo')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Heading Style Dropdown */}
          <select
            value={activeHeading}
            onChange={(e) => handleHeadingChange(e.target.value)}
            className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="p">Normal text (P)</option>
            <option value="h1">Major Heading (H1)</option>
            <option value="h2">Heading (H2)</option>
            <option value="h3">Subheading (H3)</option>
            <option value="h4">Minor Heading (H4)</option>
          </select>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Basic Text Formatting */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => exec('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-100 font-bold transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => exec('italic')}
            className="p-1.5 rounded-lg hover:bg-slate-100 italic transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => exec('underline')}
            className="p-1.5 rounded-lg hover:bg-slate-100 underline transition-colors"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => exec('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-slate-100 line-through transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Text Color Swatches */}
          <div className="relative">
            <button
              type="button"
              title="Text Color"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-[#5A1E65]" />
              <span className="text-[10px] font-bold">A</span>
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 grid grid-cols-4 gap-1.5 w-40 animate-in fade-in duration-150">
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      exec('foreColor', c.hex);
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-300 hover:scale-110 transition-transform shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text Background Highlight */}
          <div className="relative">
            <button
              type="button"
              title="Text Highlight Color"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            </button>

            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 grid grid-cols-3 gap-1.5 w-44 animate-in fade-in duration-150">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      exec('hiliteColor', c.hex);
                      setShowHighlightPicker(false);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 text-center hover:scale-105 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Alignment */}
          <button
            type="button"
            title="Align Left"
            onClick={() => exec('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => exec('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => exec('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Justify"
            onClick={() => exec('justifyFull')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Lists */}
          <button
            type="button"
            title="Bulleted List"
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Insert Link Button */}
          <button
            type="button"
            title="Insert Link"
            onClick={() => {
              const sel = window.getSelection().toString();
              if (sel) setLinkText(sel);
              setShowLinkModal(true);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#5A1E65] font-bold flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Insert Image Button */}
          <button
            type="button"
            title="Insert Picture into Article"
            onClick={() => setShowImageModal(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-purple-700 flex items-center gap-1 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          {/* Quote Block */}
          <button
            type="button"
            title="Quote Block"
            onClick={() => exec('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Callout Box Button */}
          <button
            type="button"
            title="Insert Community Callout Highlight"
            onClick={() => insertCalloutBox('purple')}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-[#5A1E65] hover:bg-purple-100 border border-purple-200 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Callout Box</span>
          </button>

          {/* Horizontal Rule */}
          <button
            type="button"
            title="Horizontal Divider"
            onClick={insertHorizontalRule}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            title="Clear Formatting"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors text-xs font-bold"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>
      )}

      {/* Editor Body */}
      <div className="relative min-h-[360px] max-h-[580px] overflow-y-auto">
        
        {/* COMPOSE MODE: Interactive WYSIWYG ContentEditable */}
        {viewMode === 'compose' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            className="p-6 md:p-8 outline-none text-slate-800 leading-relaxed font-sans prose prose-slate max-w-none min-h-[360px] focus:ring-2 focus:ring-purple-200"
            style={{
              fontSize: '15px',
              lineHeight: '1.8'
            }}
          />
        )}

        {/* HTML VIEW MODE: Raw HTML Code Area */}
        {viewMode === 'html' && (
          <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 min-h-[360px]">
            <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between pb-2 border-b border-slate-800">
              <span>Raw HTML Source (Edits here synchronize directly to your public article)</span>
              <span className="text-amber-300">HTML5 Validated</span>
            </div>
            <textarea
              value={htmlContent}
              onChange={(e) => handleContentUpdate(e.target.value)}
              rows={16}
              className="w-full bg-transparent text-emerald-300 outline-none resize-y font-mono text-xs leading-relaxed"
              placeholder="<p>Write raw HTML code or embed tags here...</p>"
            />
          </div>
        )}

        {/* PREVIEW VIEW MODE: Full Public Layout Simulation */}
        {viewMode === 'preview' && (
          <div className="p-6 md:p-10 bg-gradient-to-b from-purple-50/30 to-white min-h-[360px]">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-purple-100 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Live Reader Preview
              </span>
              <div 
                className="mt-6 prose prose-lg max-w-none text-slate-700 leading-relaxed font-medium space-y-4"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Bottom Status Bar: Word Count & Read Time (Blogspot Style) */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium select-none">
        <div className="flex items-center gap-3">
          <span>Words: <strong className="text-slate-900 font-bold">{stats.words}</strong></span>
          <span>·</span>
          <span>Characters: <strong className="text-slate-900 font-bold">{stats.chars}</strong></span>
          <span>·</span>
          <span className="text-[#5A1E65] font-bold">Estimated Time: {stats.readTime}</span>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Blogspot-grade rich text editor · Formatted for Web & Mobile
        </div>
      </div>

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4">
          <form 
            onSubmit={handleApplyLink}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-slate-950 text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#5A1E65]" />
                <span>Insert Web Link</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Text to Display</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g., Read the full community report"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Web Address (URL)</label>
              <input
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.org/resource or /programs"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={linkNewTab}
                onChange={(e) => setLinkNewTab(e.target.checked)}
                className="rounded text-[#5A1E65] focus:ring-purple-500 w-4 h-4"
              />
              <span>Open link in new window / tab</span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#5A1E65] text-white rounded-xl shadow-xs hover:bg-[#45124E]"
              >
                Insert Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Insertion Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4">
          <form 
            onSubmit={handleApplyImage}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-purple-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-slate-950 text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#5A1E65]" />
                <span>Insert Picture into Article</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Image Picker Integration */}
            <ImagePicker
              value={imageUrl || '/images/community-gathering.jpg'}
              onChange={(url) => setImageUrl(url)}
              label="Select from DCVC Photo Library or Upload"
              aspectRatio="aspect-[16/9]"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image Alignment</label>
                <select
                  value={imageAlign}
                  onChange={(e) => setImageAlign(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl font-bold bg-slate-50 focus:outline-none"
                >
                  <option value="center">Centered (Full Width)</option>
                  <option value="left">Float Left (Wrap Text)</option>
                  <option value="right">Float Right (Wrap Text)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accessibility Alt Text</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe image for screen readers"
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Photo Caption (Optional)</label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="e.g., Community members gathering at the Portola Road Resource Center"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#5A1E65] text-white rounded-xl shadow-xs hover:bg-[#45124E]"
              >
                Insert Picture
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

