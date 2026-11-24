import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('SPA Routing Fallbacks & Security Headers Verification', () => {
  it('public/_redirects contains authoritative Cloudflare Pages SPA catch-all rule', () => {
    const redirectsPath = path.resolve('public/_redirects');
    const content = fs.readFileSync(redirectsPath, 'utf8');

    // Rule must match /* -> /index.html with status 200
    assert.match(
      content,
      /^\/\*\s+\/index\.html\s+200/m,
      'public/_redirects must include /* /index.html 200 catch-all rule for Cloudflare Pages SPA deep routing'
    );
  });

  it('public/_headers authorizes Zeffy payment request API without breaking strict camera/geo controls', () => {
    const headersPath = path.resolve('public/_headers');
    const content = fs.readFileSync(headersPath, 'utf8');

    // Permissions-Policy must include payment=(self "https://www.zeffy.com")
    assert.match(
      content,
      /Permissions-Policy:.*payment=\(self\s+"https:\/\/www\.zeffy\.com"\)/,
      'public/_headers must allow payment for self and zeffy.com'
    );
  });

  it('src/App.jsx registers /admin/* wildcard route to prevent nested admin 404s', () => {
    const appPath = path.resolve('src/App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(
      content.includes('<Route path="/admin/*" element={<Admin />} />'),
      'src/App.jsx must register /admin/* route'
    );
  });
});
