import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  ADMIN_SECTIONS,
  parseAllowedSections,
  normalizeAllowedSectionsInput,
  requireSectionAccess,
  assertUserCanPublishSiteState
} from '../worker/src/sectionPermissions.js';

import {
  canAccessAdminTab,
  canAccessCmsSubTab,
  canAccessInboxSubTab,
  getFirstAllowedAdminTab,
  getFirstAllowedCmsSubTab,
  canAccessQuickSearchItem,
  filterSiteStatePatchForUser,
  ADMIN_SECTIONS as FRONTEND_SECTIONS
} from '../src/admin/permissions.js';

describe('Granular Admin Section-Level Access Control', () => {
  it('1. Server and client section catalogs stay strictly synchronized', () => {
    const serverIds = ADMIN_SECTIONS.map((s) => s.id);
    const clientIds = FRONTEND_SECTIONS.map((s) => s.id);
    assert.deepStrictEqual(clientIds, serverIds);
    assert.ok(serverIds.includes('community'), 'Must include Community Groups section');
  });

  it('2. parseAllowedSections & normalizeAllowedSectionsInput validate and sanitize section lists cleanly', () => {
    assert.strictEqual(parseAllowedSections(null), null);
    assert.strictEqual(parseAllowedSections(''), null);
    assert.strictEqual(parseAllowedSections('["*"]'), null);
    assert.deepStrictEqual(parseAllowedSections('["community","events","community","invalid_evil"]'), ['community', 'events']);

    const bad = normalizeAllowedSectionsInput(['community', 'hack_everything']);
    assert.strictEqual(bad.valid, false);
    assert.ok(bad.error.includes('Unknown admin section identifier'));

    const good = normalizeAllowedSectionsInput(['community']);
    assert.strictEqual(good.valid, true);
    assert.strictEqual(good.serialized, '["community"]');
    assert.deepStrictEqual(good.sections, ['community']);
  });

  it('3. Server RBAC rejects unauthorized sections even if user has editor role', () => {
    const communityEditor = { role: 'editor', allowedSections: ['community'] };

    // Community endpoints are allowed
    assert.strictEqual(requireSectionAccess(communityEditor, 'community', ['admin', 'editor']), true);
    // All other endpoints MUST be rejected
    assert.strictEqual(requireSectionAccess(communityEditor, 'events', ['admin', 'editor']), false);
    assert.strictEqual(requireSectionAccess(communityEditor, 'gallery', ['admin', 'editor']), false);
    assert.strictEqual(requireSectionAccess(communityEditor, 'sponsors', ['admin', 'editor']), false);
    assert.strictEqual(requireSectionAccess(communityEditor, 'directory', ['admin', 'approver', 'editor']), false);
    assert.strictEqual(requireSectionAccess(communityEditor, 'inquiries', ['admin', 'approver', 'editor']), false);
    assert.strictEqual(requireSectionAccess(communityEditor, 'donations', ['admin', 'editor']), false);

    // Read-only user even with community section selected CANNOT write
    const readOnlyCommunity = { role: 'read_only', allowedSections: ['community'] };
    assert.strictEqual(requireSectionAccess(readOnlyCommunity, 'community', ['admin', 'editor'], { write: true }), false);
    assert.strictEqual(requireSectionAccess(readOnlyCommunity, 'community', ['admin', 'editor', 'read_only'], { write: false }), true);

    // Legacy editor without allowedSections preserves full role behavior
    const legacyEditor = { role: 'editor', allowedSections: null };
    assert.strictEqual(requireSectionAccess(legacyEditor, 'events', ['admin', 'editor']), true);
    assert.strictEqual(requireSectionAccess(legacyEditor, 'directory', ['admin', 'approver']), false);

    // Admin always retains unrestricted access
    const superAdmin = { role: 'admin', allowedSections: ['community'] };
    assert.strictEqual(requireSectionAccess(superAdmin, 'donations', ['admin']), true);
  });

  it('4. Server site-state validator restricts PUT /api/admin/site-state strictly to granted sections', () => {
    const communityOnlyUser = { role: 'editor', allowedSections: ['community'] };

    // Saving Community Groups succeeds
    const validPatch = {
      cmsData: {
        communityGroups: [{ id: 'cg-1', name: 'Rainbow Umbrella' }],
        deletedCommunityGroups: [],
        lastUpdated: new Date().toISOString()
      },
      cardThemes: {
        community: { 'Youth': { gradient: 'from-purple-600' } }
      }
    };
    const ok = assertUserCanPublishSiteState(communityOnlyUser, validPatch);
    assert.strictEqual(ok.allowed, true);

    // Attempting to modify Programs or Events or Hero fails 403
    const illegalEvents = assertUserCanPublishSiteState(communityOnlyUser, {
      cmsData: {
        communityGroups: [],
        events: [{ id: 'evt-hack' }]
      }
    });
    assert.strictEqual(illegalEvents.allowed, false);
    assert.ok(illegalEvents.deniedSections.includes('events'));

    const illegalHero = assertUserCanPublishSiteState(communityOnlyUser, {
      heroTheme: 'aurora-glow'
    });
    assert.strictEqual(illegalHero.allowed, false);
    assert.ok(illegalHero.deniedSections.includes('hero'));

    const illegalResThemes = assertUserCanPublishSiteState(communityOnlyUser, {
      cardThemes: { resources: { Housing: { color: '#000' } } }
    });
    assert.strictEqual(illegalResThemes.allowed, false);
    assert.ok(illegalResThemes.deniedSections.includes('resources'));
  });

  it('5. Client UI helpers isolate tabs, subtabs, search, and patch payloads for section-scoped users', () => {
    const communityUser = { role: 'editor', allowedSections: ['community'] };

    assert.strictEqual(getFirstAllowedAdminTab(communityUser), 'cms');
    assert.strictEqual(getFirstAllowedCmsSubTab(communityUser), 'community');

    assert.strictEqual(canAccessAdminTab(communityUser, 'cms'), true);
    assert.strictEqual(canAccessAdminTab(communityUser, 'security'), true);
    assert.strictEqual(canAccessAdminTab(communityUser, 'hero'), false);
    assert.strictEqual(canAccessAdminTab(communityUser, 'donations'), false);
    assert.strictEqual(canAccessAdminTab(communityUser, 'inbox'), false);
    assert.strictEqual(canAccessAdminTab(communityUser, 'gallery'), false);

    assert.strictEqual(canAccessCmsSubTab(communityUser, 'community'), true);
    assert.strictEqual(canAccessCmsSubTab(communityUser, 'programs'), false);
    assert.strictEqual(canAccessCmsSubTab(communityUser, 'events'), false);
    assert.strictEqual(canAccessCmsSubTab(communityUser, 'settings'), false);

    assert.strictEqual(canAccessQuickSearchItem(communityUser, 'cms', 'community'), true);
    assert.strictEqual(canAccessQuickSearchItem(communityUser, 'cms', 'events'), false);
    assert.strictEqual(canAccessQuickSearchItem(communityUser, 'hero', undefined), false);

    assert.strictEqual(canAccessInboxSubTab(communityUser, 'directory'), false);

    // Filter outgoing cmsStore snapshot so non-community keys are stripped cleanly
    const fullSnapshot = {
      heroTheme: 'mosaic',
      cardThemes: { community: { Youth: {} }, resources: { Legal: {} } },
      cmsData: {
        programs: [{ id: 'p1' }],
        events: [{ id: 'e1' }],
        communityGroups: [{ id: 'cg-1', name: 'Group 1' }],
        deletedCommunityGroups: [],
        settings: { phone: '555' },
        lastUpdated: '2026-11-25T00:00:00Z'
      }
    };
    const scoped = filterSiteStatePatchForUser(fullSnapshot, communityUser);
    assert.strictEqual(scoped.heroTheme, undefined);
    assert.deepStrictEqual(Object.keys(scoped.cmsData).sort(), ['communityGroups', 'deletedCommunityGroups', 'lastUpdated']);
    assert.deepStrictEqual(Object.keys(scoped.cardThemes), ['community']);

    // Server validator approves the client-filtered patch!
    assert.strictEqual(assertUserCanPublishSiteState(communityUser, scoped).allowed, true);
  });

  it('6. Worker index.js enforces assertUserCanPublishSiteState & allowed_sections schema column', () => {
    const workerSrc = fs.readFileSync(path.resolve('worker/src/index.js'), 'utf8');
    assert.ok(workerSrc.includes('assertUserCanPublishSiteState(authUser, body)'), 'Worker must enforce section permissions on PUT /api/admin/site-state');
    assert.ok(workerSrc.includes('ALTER TABLE admin_users ADD COLUMN allowed_sections TEXT'), 'Worker must auto-migrate allowed_sections column');
    assert.ok(workerSrc.includes("requireSectionAccess(authUser, 'community'"), 'Worker must enforce community section on community group endpoints');
  });
});
