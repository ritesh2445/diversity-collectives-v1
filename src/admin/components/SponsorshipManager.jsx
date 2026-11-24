import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Settings, 
  HeartHandshake, 
  FolderPlus,
  RefreshCw,
  FileCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  getSponsorshipDocuments, 
  saveCmsSponsorshipDocument, 
  deleteCmsSponsorshipDocument, 
  reorderCmsSponsorshipDocuments,
  getSponsorshipPageContent, 
  saveCmsSponsorshipPageContent 
} from '../services/cmsClient.js';
import { validatePdfFile, uploadAndStorePdf } from '../services/pdfService.js';
import { cmsStore } from '../../services/cmsStore.js';

const CATEGORIES = [
  'Cover Letter',
  'Sponsorship Package',
  'Strategic Proposal',
  'Other'
];

export default function SponsorshipManager() {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'pageContent'
  const [documents, setDocuments] = useState(() => getSponsorshipDocuments(true));
  const [pageContent, setPageContent] = useState(() => getSponsorshipPageContent());
  const [toast, setToast] = useState('');
  
  // Modal states
  const [editingDoc, setEditingDoc] = useState(null);
  const [isNewDoc, setIsNewDoc] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Sponsorship Package');
  const [formYear, setFormYear] = useState('2027');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formStatus, setFormStatus] = useState('published');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Page Content Form
  const [contentForm, setContentForm] = useState(pageContent);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const refresh = () => {
    setDocuments(getSponsorshipDocuments(true));
    setPageContent(getSponsorshipPageContent());
    setContentForm(getSponsorshipPageContent());
  };

  useEffect(() => {
    return cmsStore.subscribe(() => {
      refresh();
    });
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Open Add Modal
  const openAddModal = () => {
    setIsNewDoc(true);
    setEditingDoc({ id: `doc-${Date.now()}` });
    setFormTitle('');
    setFormCategory('Sponsorship Package');
    setFormYear('2027');
    setFormDescription('');
    setFormDisplayOrder(documents.length + 1);
    setFormStatus('published');
    setFormFileUrl('');
    setFormFileName('');
    setFormFileSize('');
    setSelectedFile(null);
    setFileError('');
  };

  // Open Edit Modal
  const openEditModal = (doc) => {
    setIsNewDoc(false);
    setEditingDoc(doc);
    setFormTitle(doc.title || '');
    setFormCategory(doc.category || 'Other');
    setFormYear(doc.year ? String(doc.year) : '2027');
    setFormDescription(doc.description || '');
    setFormDisplayOrder(doc.displayOrder || 1);
    setFormStatus(doc.status || 'published');
    setFormFileUrl(doc.fileUrl || '');
    setFormFileName(doc.fileName || '');
    setFormFileSize(doc.fileSize || '');
    setSelectedFile(null);
    setFileError('');
  };

  // File selection & validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePdfFile(file, { maxSizeMb: 15 });
    if (!validation.isValid) {
      setFileError(validation.error);
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setFormFileName(validation.fileName);
    setFormFileSize(validation.sizeFormatted);
  };

  // Save Document (Add / Edit)
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please provide a document title.');
      return;
    }

    if (!selectedFile && !formFileUrl) {
      setFileError('Please select a PDF document to upload.');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = formFileUrl;
      let finalName = formFileName;
      let finalSize = formFileSize;

      // If a new file was chosen, process upload
      if (selectedFile) {
        const uploadRes = await uploadAndStorePdf(selectedFile, { maxSizeMb: 15 });
        finalUrl = uploadRes.url;
        finalName = uploadRes.fileName;
        finalSize = uploadRes.fileSize;
      }

      const docPayload = {
        id: editingDoc.id,
        title: formTitle.trim(),
        category: formCategory,
        year: formYear.trim() || '2027',
        description: formDescription.trim(),
        displayOrder: Number(formDisplayOrder) || 1,
        status: formStatus,
        fileUrl: finalUrl,
        fileName: finalName,
        fileSize: finalSize,
        createdAt: editingDoc.createdAt || new Date().toISOString()
      };

      saveCmsSponsorshipDocument(docPayload);
      refresh();
      setEditingDoc(null);
      showToast(isNewDoc ? 'Sponsorship document created and published!' : 'Sponsorship document updated successfully!');
    } catch (err) {
      setFileError(err.message || 'Failed to save document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle publish/unpublish directly from list
  const handleTogglePublish = (doc) => {
    const nextStatus = doc.status === 'published' ? 'draft' : 'published';
    saveCmsSponsorshipDocument({
      ...doc,
      status: nextStatus
    });
    refresh();
    showToast(`Document "${doc.title}" marked as ${nextStatus.toUpperCase()}.`);
  };

  // Reorder documents (Move Up / Down)
  const handleMoveOrder = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= documents.length) return;

    const reordered = [...documents];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map(d => d.id);
    reorderCmsSponsorshipDocuments(orderedIds);
    refresh();
    showToast('Display order updated.');
  };

  // Delete document
  const handleConfirmDelete = () => {
    if (!deleteConfirmDoc) return;
    deleteCmsSponsorshipDocument(deleteConfirmDoc.id);
    refresh();
    showToast(`Document "${deleteConfirmDoc.title}" deleted.`);
    setDeleteConfirmDoc(null);
  };

  // Save Page Content
  const handleSavePageContent = (e) => {
    e.preventDefault();
    setIsSavingContent(true);
    saveCmsSponsorshipPageContent(contentForm);
    refresh();
    setIsSavingContent(false);
    showToast('Sponsorship page content updated and published live!');
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
          <button type="button" onClick={() => setToast('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-[#5A1E65] to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
              CORPORATE PARTNERSHIP PORTAL
            </span>
            <span className="text-[10px] bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded-full font-mono border border-purple-700">
              Live Sync Active
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Sponsorship & Document Management
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Upload and manage official DCVC sponsorship PDFs, customize introductory headings and partnership inquiry details. Changes publish immediately without manual deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/sponsorships"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-2"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'documents'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Library</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-[#5A1E65] font-extrabold">
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pageContent')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'pageContent'
                ? 'border-[#5A1E65] text-[#5A1E65] bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Page Content & Copy</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {documents.filter(d => d.status === 'published').length} Published · {documents.filter(d => d.status === 'draft').length} Drafts
        </div>
      </div>

      {/* TAB 1: Document Library */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-display text-base font-bold text-slate-900">No sponsorship documents uploaded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first sponsorship package, cover letter, or proposal PDF.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A1E65] text-white hover:bg-purple-900 transition-colors inline-flex items-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload PDF</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc, idx) => {
                const isPublished = doc.status === 'published';
                return (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-grow max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(doc)}
                          className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {isPublished ? <Check className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-amber-600" />}
                          <span>{doc.status}</span>
                        </button>

                        {/* Category */}
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                          {doc.category || 'Other'}
                        </span>

                        {/* Year */}
                        {doc.year && (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                            {doc.year}
                          </span>
                        )}

                        {/* Order badge */}
                        <span className="text-[10px] text-slate-400 font-mono">
                          Order #{doc.displayOrder || (idx + 1)}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">
                        {doc.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {doc.description || "No description entered."}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          {doc.fileName || 'document.pdf'}
                        </span>
                        <span>·</span>
                        <span>{doc.fileSize || 'Standard PDF'}</span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Reorder Buttons */}
                      <div className="flex items-center mr-2 border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(idx, -1)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === documents.length - 1}
                          onClick={() => handleMoveOrder(idx, 1)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 rounded-xl text-slate-700 hover:text-[#5A1E65] hover:bg-purple-50 border border-slate-200 transition-colors"
                        title="Preview Document Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* View File in Tab */}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-slate-700 hover:text-[#5A1E65] hover:bg-purple-50 border border-slate-200 transition-colors"
                          title="Open PDF file in new browser tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="p-2 rounded-xl text-slate-700 hover:text-[#5A1E65] hover:bg-purple-50 border border-slate-200 transition-colors"
                        title="Edit Document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmDoc(doc)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Page Content & Copy Editor */}
      {activeTab === 'pageContent' && (
        <form onSubmit={handleSavePageContent} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Public Sponsorship Page Text & Content
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Customize the headings, mission explanation, section titles, and contact details shown on the public `/sponsorships` route.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hero Eyebrow Label</label>
              <input
                type="text"
                value={contentForm.heroEyebrow || ''}
                onChange={(e) => setContentForm({ ...contentForm, heroEyebrow: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Page Main Heading (H1)</label>
              <input
                type="text"
                value={contentForm.headline || ''}
                onChange={(e) => setContentForm({ ...contentForm, headline: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Impact Hook</label>
            <input
              type="text"
              value={contentForm.subtitle || ''}
              onChange={(e) => setContentForm({ ...contentForm, subtitle: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Introductory Description</label>
            <textarea
              rows={4}
              value={contentForm.introduction || ''}
              onChange={(e) => setContentForm({ ...contentForm, introduction: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65] leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Documents Section Title</label>
              <input
                type="text"
                value={contentForm.sectionTitle || ''}
                onChange={(e) => setContentForm({ ...contentForm, sectionTitle: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Documents Section Subtitle</label>
              <input
                type="text"
                value={contentForm.sectionSubtitle || ''}
                onChange={(e) => setContentForm({ ...contentForm, sectionSubtitle: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-display text-sm font-bold text-slate-900">Partnership Inquiry CTA & Contact Block</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CTA Heading</label>
                <input
                  type="text"
                  value={contentForm.contactHeading || ''}
                  onChange={(e) => setContentForm({ ...contentForm, contactHeading: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={contentForm.contactCtaText || ''}
                  onChange={(e) => setContentForm({ ...contentForm, contactCtaText: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Subtitle / Explanation</label>
              <textarea
                rows={2}
                value={contentForm.contactSubtitle || ''}
                onChange={(e) => setContentForm({ ...contentForm, contactSubtitle: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partnership Email</label>
                <input
                  type="email"
                  value={contentForm.contactEmail || ''}
                  onChange={(e) => setContentForm({ ...contentForm, contactEmail: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contentForm.contactPhone || ''}
                  onChange={(e) => setContentForm({ ...contentForm, contactPhone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Center Address</label>
                <input
                  type="text"
                  value={contentForm.contactAddress || ''}
                  onChange={(e) => setContentForm({ ...contentForm, contactAddress: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingContent}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5A1E65] text-white hover:bg-purple-900 shadow-md transition-colors flex items-center gap-2"
            >
              {isSavingContent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save & Publish Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: Add / Edit Document */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                  {isNewDoc ? 'ADD SPONSORSHIP RESOURCE' : 'EDIT SPONSORSHIP RESOURCE'}
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {isNewDoc ? 'Upload New Sponsorship PDF' : 'Edit Document Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. DCVC 2027 Sponsorship Opportunities Packet"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                  required
                />
              </div>

              {/* Category, Year & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year / Campaign</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2027"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65]"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publication Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formStatus === 'published'}
                      onChange={() => setFormStatus('published')}
                      className="text-[#5A1E65] focus:ring-[#5A1E65]"
                    />
                    <span>Published (Visible publicly)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formStatus === 'draft'}
                      onChange={() => setFormStatus('draft')}
                      className="text-[#5A1E65] focus:ring-[#5A1E65]"
                    />
                    <span>Draft (Admin only)</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Outline key benefits, investment tiers, or executive alignment details..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5A1E65]/20 focus:border-[#5A1E65] leading-relaxed"
                  required
                />
              </div>

              {/* PDF File Upload / Replacement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PDF Document File {isNewDoc && <span className="text-rose-500">*</span>}
                </label>

                {formFileUrl && !selectedFile && (
                  <div className="mb-2 p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      <span className="font-bold text-purple-950 truncate">{formFileName || 'document.pdf'}</span>
                      <span className="text-purple-600 shrink-0">({formFileSize || 'Active'})</span>
                    </div>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold shrink-0">
                      Current File
                    </span>
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    fileError 
                      ? 'border-rose-300 bg-rose-50/50' 
                      : 'border-slate-300 hover:border-[#5A1E65] bg-slate-50/50 hover:bg-purple-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : (formFileUrl ? 'Click to replace with a new PDF' : 'Click to select PDF document')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Accepted: .pdf only (Max 15MB)
                  </p>
                  {selectedFile && (
                    <span className="inline-block mt-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Ready: {formFileSize}
                    </span>
                  )}
                </div>

                {fileError && (
                  <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5A1E65] text-white hover:bg-purple-900 shadow-md transition-colors flex items-center gap-2"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isNewDoc ? 'Upload & Save' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Preview Document */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A1E65]">
                DOCUMENT PREVIEW
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5A1E65] border border-purple-200">
                  {previewDoc.category}
                </span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {previewDoc.year} Campaign
                </span>
                <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${
                  previewDoc.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {previewDoc.status}
                </span>
              </div>

              <h3 className="font-display text-xl font-bold text-slate-950">
                {previewDoc.title}
              </h3>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {previewDoc.description}
              </p>

              <div className="text-xs text-slate-500 space-y-1 pt-1">
                <p><strong>File Name:</strong> {previewDoc.fileName}</p>
                <p><strong>File Size:</strong> {previewDoc.fileSize}</p>
                <p><strong>Display Order:</strong> #{previewDoc.displayOrder}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              {previewDoc.fileUrl && (
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A1E65] text-white hover:bg-purple-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF in Tab</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Delete Sponsorship Document?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteConfirmDoc.title}"</strong>? This will immediately remove it from both the Admin Panel and the public Sponsorships page.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
