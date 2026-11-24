import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  cmsStore, 
  DEFAULT_SPONSORSHIP_DOCUMENTS, 
  DEFAULT_SPONSORSHIP_PAGE_CONTENT,
  mergeSponsorshipDocumentsWithDefaults
} from '../src/services/cmsStore.js';
import {
  getSponsorshipDocuments,
  getPublishedSponsorshipDocuments,
  saveCmsSponsorshipDocument,
  deleteCmsSponsorshipDocument,
  reorderCmsSponsorshipDocuments,
  getSponsorshipPageContent,
  saveCmsSponsorshipPageContent
} from '../src/admin/services/cmsClient.js';
import { 
  validatePdfFile, 
  formatFileSize, 
  uploadAndStorePdf 
} from '../src/admin/services/pdfService.js';

describe('Sponsorship & Corporate Partnerships Document Library', () => {

  beforeEach(() => {
    // Reset CMS state before each test
    cmsStore.resetToFactoryDefaults();
  });

  it('1. Initial Seed: DEFAULT_SPONSORSHIP_DOCUMENTS is empty so no fake placeholder PDFs overwrite admin uploads', () => {
    const docs = getPublishedSponsorshipDocuments();
    assert.ok(Array.isArray(docs), 'Should return an array');
    assert.strictEqual(docs.length, 0, 'Should have 0 fake seed documents by default');
    assert.ok(
      docs.every(d => !['doc-2027-cover-letter', 'doc-2027-opportunities-packet', 'doc-2027-strategic-proposal'].includes(d.id)),
      'Must not contain fake placeholder sponsorship documents'
    );
  });

  it('2. Public access is strictly restricted to published documents only (Drafts hidden)', () => {
    // Add a draft document
    const draftDoc = {
      id: 'doc-confidential-draft-2027',
      title: '2027 Confidential Board Working Draft',
      description: 'Internal preview before public launch.',
      category: 'Other',
      year: '2027',
      fileUrl: '/documents/sponsorships/test-draft.pdf',
      fileName: 'test-draft.pdf',
      fileSize: '5 KB',
      status: 'draft',
      displayOrder: 99
    };

    saveCmsSponsorshipDocument(draftDoc);

    // Admin view (includeDrafts = true)
    const adminDocs = getSponsorshipDocuments(true);
    assert.ok(adminDocs.some(d => d.id === 'doc-confidential-draft-2027'), 'Admin must see draft');

    // Public view (getPublishedSponsorshipDocuments)
    const publicDocs = getPublishedSponsorshipDocuments();
    assert.strictEqual(
      publicDocs.some(d => d.id === 'doc-confidential-draft-2027'),
      false,
      'Public page must NEVER display draft documents'
    );
  });

  it('3. PDF Validator accepts valid PDFs and rejects non-PDFs or oversized files', () => {
    // 1. Valid PDF file
    const validFile = {
      name: 'DCVC-2027-Sponsorship-Agreement.pdf',
      type: 'application/pdf',
      size: 1024 * 500 // 500 KB
    };
    const validRes = validatePdfFile(validFile);
    assert.strictEqual(validRes.isValid, true);
    assert.strictEqual(validRes.fileName, 'dcvc-2027-sponsorship-agreement.pdf');
    assert.strictEqual(validRes.sizeFormatted, '500.0 KB');

    // 2. Reject missing file
    const nullRes = validatePdfFile(null);
    assert.strictEqual(nullRes.isValid, false);
    assert.ok(nullRes.error.includes('No document file was selected'));

    // 3. Reject non-PDF MIME / extension (e.g. executable or Word doc)
    const exeFile = {
      name: 'malicious-program.exe',
      type: 'application/x-msdownload',
      size: 1024 * 100
    };
    const exeRes = validatePdfFile(exeFile);
    assert.strictEqual(exeRes.isValid, false);
    assert.ok(exeRes.error.includes('Only PDF (.pdf) documents are accepted'));

    const docxFile = {
      name: 'proposal.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024 * 100
    };
    const docxRes = validatePdfFile(docxFile);
    assert.strictEqual(docxRes.isValid, false);
    assert.ok(docxRes.error.includes('Only PDF (.pdf) documents are accepted'));

    // 4. Reject file exceeding max limit (e.g. > 15MB)
    const hugeFile = {
      name: 'massive-catalog.pdf',
      type: 'application/pdf',
      size: 20 * 1024 * 1024 // 20 MB
    };
    const hugeRes = validatePdfFile(hugeFile, { maxSizeMb: 15 });
    assert.strictEqual(hugeRes.isValid, false);
    assert.ok(hugeRes.error.includes('exceeds the maximum allowed limit'));
  });

  it('4. Format file size utility converts bytes accurately', () => {
    assert.strictEqual(formatFileSize(0), 'PDF Document');
    assert.strictEqual(formatFileSize(512), '512 B');
    assert.strictEqual(formatFileSize(1024 * 150), '150.0 KB');
    assert.strictEqual(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');
  });

  it('5. CRUD: Full lifecycle of upload, edit, reorder, and deletion with confirmation', () => {
    const initialCount = getSponsorshipDocuments(true).length;

    // Create two new documents
    const doc1 = {
      id: 'doc-real-sponsor-packet-2027',
      title: '2027 Real Sponsor Packet',
      description: 'Official corporate partnership tiers for DCVC.',
      category: 'Sponsorship Package',
      year: '2027',
      fileUrl: '/documents/sponsorships/real-packet.pdf',
      fileName: 'real-packet.pdf',
      fileSize: '240 KB',
      status: 'published',
      displayOrder: 1
    };
    const doc2 = {
      id: 'doc-in-kind-guidelines-2027',
      title: '2027 In-Kind Contribution Guidelines',
      description: 'Accepted technology, clinic testing kits, and professional services for DCVC.',
      category: 'Other',
      year: '2027',
      fileUrl: '/documents/sponsorships/in-kind-guidelines.pdf',
      fileName: 'in-kind-guidelines.pdf',
      fileSize: '120 KB',
      status: 'published',
      displayOrder: 2
    };

    saveCmsSponsorshipDocument(doc1);
    saveCmsSponsorshipDocument(doc2);
    let list = getSponsorshipDocuments(true);
    assert.strictEqual(list.length, initialCount + 2, 'List should now have 2 added documents');
    const created = list.find(d => d.id === 'doc-in-kind-guidelines-2027');
    assert.ok(created);
    assert.strictEqual(created.title, '2027 In-Kind Contribution Guidelines');

    // Update document title and category
    const updatedPayload = {
      ...created,
      title: '2027 Official In-Kind Donor & Supply Packet',
      category: 'Sponsorship Package'
    };
    saveCmsSponsorshipDocument(updatedPayload);
    list = getSponsorshipDocuments(true);
    const updated = list.find(d => d.id === 'doc-in-kind-guidelines-2027');
    assert.strictEqual(updated.title, '2027 Official In-Kind Donor & Supply Packet');
    assert.strictEqual(updated.category, 'Sponsorship Package');

    // Reorder documents (put doc2 first)
    const reorderedIds = [
      'doc-in-kind-guidelines-2027',
      'doc-real-sponsor-packet-2027'
    ];
    reorderCmsSponsorshipDocuments(reorderedIds);
    list = getSponsorshipDocuments(true);
    assert.strictEqual(list[0].id, 'doc-in-kind-guidelines-2027');
    assert.strictEqual(list[0].displayOrder, 1);

    // Delete documents
    deleteCmsSponsorshipDocument('doc-in-kind-guidelines-2027');
    deleteCmsSponsorshipDocument('doc-real-sponsor-packet-2027');
    list = getSponsorshipDocuments(true);
    assert.strictEqual(list.length, initialCount, 'Should be back to initial count');
    assert.strictEqual(list.some(d => d.id === 'doc-in-kind-guidelines-2027'), false);
  });

  it('6. Dynamic Page Content: Admin can edit headlines, mission text, and contact CTA', () => {
    const defaultContent = getSponsorshipPageContent();
    assert.ok(defaultContent.headline, 'Must have default headline');
    assert.ok(defaultContent.introduction.toLowerCase().includes('advocacy'), 'Must mention advocacy');
    assert.ok(defaultContent.contactEmail, 'Must have contact email');

    // Update page content
    const customContent = {
      headline: 'Ventura County Corporate & Foundation Alliances',
      subtitle: 'Building a Resilient, Healthy Future for LGBTQ+ Youth and Families',
      introduction: 'Join DCVC in advancing regional equity, emergency support, and vibrant cultural visibility.',
      contactCtaText: 'Schedule an Executive Meeting'
    };

    saveCmsSponsorshipPageContent(customContent);
    const saved = getSponsorshipPageContent();
    assert.strictEqual(saved.headline, 'Ventura County Corporate & Foundation Alliances');
    assert.strictEqual(saved.subtitle, 'Building a Resilient, Healthy Future for LGBTQ+ Youth and Families');
    assert.strictEqual(saved.contactCtaText, 'Schedule an Executive Meeting');
    // Ensure untouched fields like email remain preserved
    assert.strictEqual(saved.contactEmail, 'info@diversitycollective.org');
  });

  it('7. Physical PDF files exist on disk in public/documents/sponsorships/', () => {
    const dir = path.join(process.cwd(), 'public', 'documents', 'sponsorships');
    assert.ok(fs.existsSync(dir), 'public/documents/sponsorships/ folder must exist');

    const expectedFiles = [
      'dcvc-2027-sponsorship-cover-letter.pdf',
      'dcvc-2027-sponsorship-opportunities-packet.pdf',
      'dcvc-2027-strategic-partnership-proposal.pdf'
    ];

    for (const file of expectedFiles) {
      const fullPath = path.join(dir, file);
      assert.ok(fs.existsSync(fullPath), `File ${file} must exist`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 1000, `File ${file} must be a non-empty PDF (> 1000 bytes)`);
    }
  });

  it('8. mergeSponsorshipDocumentsWithDefaults prevents duplicate entries and respects deletions', () => {
    const customDefaults = [
      { id: 'doc-custom-1', title: 'Default 1', displayOrder: 1 },
      { id: 'doc-custom-2', title: 'Default 2', displayOrder: 2 },
      { id: 'doc-custom-3', title: 'Default 3', displayOrder: 3 }
    ];
    const saved = [
      { id: 'doc-custom-1', title: 'Custom Cover Letter Title', displayOrder: 1 }
    ];
    const deleted = ['doc-custom-3'];

    const merged = mergeSponsorshipDocumentsWithDefaults(saved, customDefaults, deleted);

    // Cover letter has custom title
    const coverLetter = merged.find(d => d.id === 'doc-custom-1');
    assert.strictEqual(coverLetter.title, 'Custom Cover Letter Title');

    // doc-custom-3 was deleted, must NOT be present
    assert.strictEqual(merged.some(d => d.id === 'doc-custom-3'), false);

    // doc-custom-2 was not modified or deleted, seed is preserved
    assert.ok(merged.some(d => d.id === 'doc-custom-2'));
  });

});
