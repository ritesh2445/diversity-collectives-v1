# Diversity Collective CMS Studio (Sanity v3)

This directory contains the completely isolated Sanity Studio application for Diversity Collective Ventura County (`diversitycollective.org`).

## Admin Isolation Architecture

Per our formal architectural requirements:
- The Sanity Studio is **strictly isolated** from the public website application.
- It is designed to be hosted on an independent administrative subdomain: `https://studio.diversitycollective.org` (or directly via Sanity Cloud at `https://dcvc.sanity.studio`).
- **No administrative routes (`/studio`, `/admin`) exist within the public React application bundle.**
- The public website communicates with Sanity strictly through read-only CDN GROQ endpoints (`https://v7z28m5x.api.sanity.io/v2023-08-01/data/query/production`) using public read tokens only.

## Content Types & Schemas

The Studio provides custom schemas for:
1. **Programs & Services (`program.js`)**: Chapters, amenities, schedules, locations, eligibility.
2. **Community Events (`event.js`)**: Calendar events, recurring schedules, cancellation flags, capacity.
3. **P.R.I.D.E. Training Catalog (`trainingModule.js`)**: Course outlines, target sectors, CEU credits, durations.
4. **Board of Directors (`boardMember.js`)**: Officers, committee chairs, portraits, bios.
5. **Staff Directory (`staffMember.js`)**: Departments, portraits, direct contact emails.
6. **Sponsors & Partners (`sponsor.js`)**: Tiered benefactor management (Founding, Champion, Civic, Business).
7. **Community Resources (`resource.js`)**: Local crisis, medical, legal, and housing resources with Spanish-language filters.
8. **News & Stories (`newsArticle.js`)**: Community dispatches and press releases with portable text.
9. **Visual Gallery (`galleryItem.js`)**: Community photo archive with mandatory alt text for WCAG 2.2 AA.
10. **Global Site Settings (`siteSettings.js`)**: Organization EIN, headquarters hours, emergency announcement banner.

## Local Development

```bash
cd studio
npm install
npm run dev
```

Studio will run locally at `http://localhost:3333`.

## Production Deployment to Subdomain

To deploy to `studio.diversitycollective.org` or Sanity Cloud:

```bash
# 1. Login with DCVC organization credentials
npx sanity login

# 2. Deploy to Sanity managed hosting
npm run deploy
# Or build static bundle for Cloudflare Pages / Vercel
npm run build
```

## User Roles & Permissions

- **Administrator**: Full publish, delete, and schema management rights.
- **Editor**: Can create, draft, and edit all content items; requires admin approval for site settings.
- **Reviewer**: Read-only preview rights for board members.

