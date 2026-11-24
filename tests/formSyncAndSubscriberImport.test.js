import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_FORM_SCHEMAS,
  normalizeSiteFeatures,
  getSiteFeatures,
  saveSiteFeatures
} from '../src/services/siteFeaturesStore.js';
import { sanitizeSiteStatePatch } from '../worker/src/siteStateService.js';
import { generateAuthToken } from '../worker/src/adminApi.js';
import worker from '../worker/src/index.js';

const ROOT = path.resolve(process.cwd());
const SECRET = 'test_jwt_secret_for_bulk_import_checks_987654';

describe('Universal Form Sync & Newsletter Bulk Subscriber Import', () => {
  it('1. Volunteer, Contact, Training, Directory & Resource form schemas match real site forms 1-to-1', () => {
    const volIds = DEFAULT_FORM_SCHEMAS.volunteer.fields.map((f) => f.id);
    assert.deepStrictEqual(volIds, [
      'preferredName',
      'pronouns',
      'fullName',
      'email',
      'phone',
      'availability',
      'areasOfInterest',
      'message'
    ]);
    assert.strictEqual(DEFAULT_FORM_SCHEMAS.volunteer.fields.find((f) => f.id === 'areasOfInterest').type, 'checkbox_group');
    assert.strictEqual(DEFAULT_FORM_SCHEMAS.volunteer.fields.find((f) => f.id === 'availability').type, 'select');

    const contactIds = DEFAULT_FORM_SCHEMAS.contact.fields.map((f) => f.id);
    assert.deepStrictEqual(contactIds, ['name', 'email', 'phone', 'topic', 'message']);
    assert.strictEqual(DEFAULT_FORM_SCHEMAS.contact.fields.find((f) => f.id === 'topic').options.length, 9);

    const trainingIds = DEFAULT_FORM_SCHEMAS.training.fields.map((f) => f.id);
    assert.ok(trainingIds.includes('isSeekingDcvcApprovedStatus'));
    assert.ok(trainingIds.includes('courseSlug'));
    assert.ok(trainingIds.includes('estimatedAttendees'));
    assert.ok(trainingIds.includes('preferredFormat'));

    const dirIds = DEFAULT_FORM_SCHEMAS.directory_submit.fields.map((f) => f.id);
    assert.ok(dirIds.includes('isLGBTQOwned'));
    assert.ok(dirIds.includes('ownerName'));
    assert.ok(dirIds.includes('ownerEmail'));

    const resIds = DEFAULT_FORM_SCHEMAS.resource_submit.fields.map((f) => f.id);
    assert.ok(resIds.includes('organizationName'));
    assert.ok(resIds.includes('spanishAvailable'));
    assert.ok(resIds.includes('freeOrSlidingScale'));
  });

  it('2. Upgrades legacy v1 schemas to synchronized v3 forms while preserving custom Admin fields', () => {
    const legacySaved = {
      formSchemas: {
        volunteer: {
          id: 'volunteer',
          title: 'Old Volunteer Form',
          fields: [
            { id: 'name', label: 'Full Name', type: 'text', required: true },
            { id: 'role', label: 'Preferred Volunteer Role', type: 'select', required: true, options: ['Greeter'] },
            { id: 'tshirt_size_99ab', label: 'T-Shirt Size', type: 'text', required: false }
          ]
        }
      }
    };

    const merged = normalizeSiteFeatures(legacySaved);
    const volFields = merged.formSchemas.volunteer.fields;

    assert.strictEqual(merged.formSchemas.volunteer.schemaVersion, 3);
    assert.ok(volFields.some((f) => f.id === 'preferredName'), 'Upgraded v3 must include preferredName');
    assert.ok(volFields.some((f) => f.id === 'pronouns'), 'Upgraded v3 must include pronouns');
    assert.ok(volFields.some((f) => f.id === 'areasOfInterest'), 'Upgraded v3 must include areasOfInterest');
    assert.ok(!volFields.some((f) => f.id === 'role'), 'Stale placeholder role must not survive v1->v3 upgrade');
    assert.ok(volFields.some((f) => f.id === 'tshirt_size_99ab'), 'Admin custom fields must be preserved across upgrade');
  });

  it('3. Honors deleted fields (deletedFieldIds) and custom edits immediately in siteFeaturesStore & sanitizeSiteStatePatch', () => {
    const initial = getSiteFeatures();
    const volunteerFieldsWithoutPronouns = initial.formSchemas.volunteer.fields.filter((f) => f.id !== 'pronouns');
    const customField = {
      id: 'emergency_contact_1a2b',
      label: 'Emergency Contact',
      type: 'text',
      required: true,
      grid: 'full'
    };

    const next = saveSiteFeatures((prev) => ({
      ...prev,
      formSchemas: {
        ...prev.formSchemas,
        volunteer: {
          ...prev.formSchemas.volunteer,
          schemaVersion: 3,
          deletedFieldIds: ['pronouns'],
          fields: [...volunteerFieldsWithoutPronouns, customField]
        }
      }
    }));

    assert.ok(!next.formSchemas.volunteer.fields.some((f) => f.id === 'pronouns'), 'Deleted pronouns must stay deleted');
    assert.ok(next.formSchemas.volunteer.fields.some((f) => f.id === 'emergency_contact_1a2b'), 'Custom field must persist');

    const sanitized = sanitizeSiteStatePatch({ siteFeatures: next });
    assert.ok(sanitized.siteFeatures.formSchemas.volunteer.fields.some((f) => f.id === 'emergency_contact_1a2b'));
    assert.ok(!sanitized.siteFeatures.formSchemas.volunteer.fields.some((f) => f.id === 'pronouns'));

    // Restore clean defaults in memory for downstream tests
    saveSiteFeatures((prev) => ({
      ...prev,
      formSchemas: {
        ...prev.formSchemas,
        volunteer: structuredClone(DEFAULT_FORM_SCHEMAS.volunteer)
      }
    }));
  });

  it('4. Every public form page & booking component is wired to live DynamicSchemaFields & siteFeaturesStore', () => {
    const publicFormFiles = [
      'src/pages/Volunteer.jsx',
      'src/pages/Contact.jsx',
      'src/pages/TrainingBooking.jsx',
      'src/pages/DirectorySubmit.jsx',
      'src/pages/ResourceSubmit.jsx'
    ];

    for (const relPath of publicFormFiles) {
      const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
      assert.ok(content.includes('useLiveFormSchema'), `${relPath} must use useLiveFormSchema for instant live updates`);
      assert.ok(content.includes('DynamicSchemaFields'), `${relPath} must render fields dynamically with DynamicSchemaFields`);
    }

    const hivContent = fs.readFileSync(path.join(ROOT, 'src/pages/AppointmentBooking.jsx'), 'utf8');
    assert.ok(hivContent.includes('DynamicSchemaFields'), 'AppointmentBooking must support full DynamicSchemaFields types');

    const flexContent = fs.readFileSync(path.join(ROOT, 'src/components/FlexSpaceBookingSection.jsx'), 'utf8');
    assert.ok(flexContent.includes('DynamicSchemaFields'), 'FlexSpaceBookingSection must support full DynamicSchemaFields types');

    const studioContent = fs.readFileSync(path.join(ROOT, 'src/admin/components/SiteFeaturesStudio.jsx'), 'utf8');
    assert.ok(studioContent.includes('checkbox_group') && studioContent.includes('deletedFieldIds'), 'SiteFeaturesStudio must support checkbox_group and deletedFieldIds');
  });

  it('5. Newsletter bulk import endpoint enforces inquiries RBAC, validates emails, deduplicates, and rejects empty batches', async () => {
    const adminToken = await generateAuthToken(
      { userId: 'u_admin', email: 'admin@diversitycollective.org', role: 'admin', name: 'Admin', allowedSections: null },
      SECRET
    );
    const eventsOnlyToken = await generateAuthToken(
      { userId: 'u_events', email: 'events@diversitycollective.org', role: 'editor', name: 'Events Lead', allowedSections: ['events'] },
      SECRET
    );
    const env = { ADMIN_JWT_SECRET: SECRET };
    const ctx = { waitUntil: () => {} };

    // Unauthenticated rejected
    const unauthRes = await worker.fetch(
      new Request('https://api.example.org/api/admin/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: ['a@example.org'] })
      }),
      env,
      ctx
    );
    assert.strictEqual(unauthRes.status, 401);

    // Editor without inquiries section permission rejected with 403
    const forbiddenRes = await worker.fetch(
      new Request('https://api.example.org/api/admin/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${eventsOnlyToken}` },
        body: JSON.stringify({ emails: ['a@example.org'] })
      }),
      env,
      ctx
    );
    assert.strictEqual(forbiddenRes.status, 403);

    // Empty / invalid batch rejected with 400
    const badRes = await worker.fetch(
      new Request('https://api.example.org/api/admin/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ emails: ['not-an-email', 'missing-at.com'] })
      }),
      env,
      ctx
    );
    assert.strictEqual(badRes.status, 400);

    // Valid mixed batch deduplicates & counts invalid entries accurately
    const okRes = await worker.fetch(
      new Request('https://api.example.org/api/admin/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          source: 'gala_import',
          emails: ['Alex@Example.org', 'alex@example.org', 'sam@community.net', 'invalid-line']
        })
      }),
      env,
      ctx
    );
    assert.strictEqual(okRes.status, 201);
    const okData = await okRes.json();
    assert.strictEqual(okData.success, true);
    assert.strictEqual(okData.imported, 2);
    assert.strictEqual(okData.duplicateInInput, 1);
    assert.strictEqual(okData.invalidCount, 1);

    // Admin UI contains Import Subscribers button & parser
    const adminJsx = fs.readFileSync(path.join(ROOT, 'src/pages/Admin.jsx'), 'utf8');
    assert.ok(adminJsx.includes('Import Subscribers'), 'Admin UI must expose Import Subscribers control');
    assert.ok(adminJsx.includes('/admin/newsletter/subscribers/import'), 'Admin UI must call bulk import API');
  });
});
