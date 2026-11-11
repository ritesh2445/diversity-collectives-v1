export default {
  name: 'siteSettings',
  title: 'Website Settings & Full Design Control',
  type: 'document',
  groups: [
    { name: 'org', title: 'Organization & Info', default: true },
    { name: 'banner', title: 'Announcement Banner' },
    { name: 'hero', title: 'Homepage Hero' },
    { name: 'theme', title: 'Colors, Buttons & Fonts' },
    { name: 'sections', title: 'Homepage Section Order' }
  ],
  fields: [
    {
      name: 'orgName',
      title: 'Organization Name',
      description: 'Official nonprofit legal name.',
      type: 'string',
      group: 'org',
      initialValue: 'Diversity Collective Ventura County'
    },
    {
      name: 'tagline',
      title: 'Mission Tagline',
      description: 'The core welcoming motto shown across headers and footers.',
      type: 'string',
      group: 'org',
      initialValue: 'You Are Always Welcome Here.'
    },
    {
      name: 'mission',
      title: 'Mission Statement',
      description: 'Short organization mission used in footers and descriptions.',
      type: 'text',
      rows: 2,
      group: 'org',
      initialValue: 'Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community.'
    },
    {
      name: 'ein',
      title: 'Tax EIN Number',
      description: '501(c)(3) federal tax identification number.',
      type: 'string',
      group: 'org',
      initialValue: '46-5312131'
    },
    {
      name: 'phone',
      title: 'Main Phone Number',
      description: 'Helpline and front desk telephone.',
      type: 'string',
      group: 'org',
      initialValue: '(805) 644-LGBT (5428)'
    },
    {
      name: 'email',
      title: 'Main Contact Email',
      description: 'General inquiries email.',
      type: 'string',
      group: 'org',
      initialValue: 'info@diversitycollective.org'
    },
    {
      name: 'address',
      title: 'Sanctuary Address',
      description: 'Physical location of the Community Resource Center.',
      type: 'string',
      group: 'org',
      initialValue: '2471 Portola Road, Suite 100, Ventura, CA 93003'
    },
    {
      name: 'hours',
      title: 'Center Hours',
      description: 'Weekly operating hours for visitors.',
      type: 'string',
      group: 'org',
      initialValue: 'Monday – Friday, 1:00 PM – 5:00 PM'
    },
    {
      name: 'socials',
      title: 'Social Media Links',
      type: 'object',
      group: 'org',
      fields: [
        { name: 'facebook', title: 'Facebook URL', type: 'url' },
        { name: 'instagram', title: 'Instagram URL', type: 'url' },
        { name: 'youtube', title: 'YouTube URL', type: 'url' }
      ]
    },
    {
      name: 'announcementBanner',
      title: 'Top Announcement Banner',
      description: 'Urgent notices or festival announcements pinned to the very top of the website.',
      type: 'object',
      group: 'banner',
      fields: [
        {
          name: 'enabled',
          title: 'Show Banner?',
          description: 'Toggle on to make the banner visible.',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'text',
          title: 'Banner Message',
          description: 'Short headline shown in the announcement bar.',
          type: 'string'
        },
        {
          name: 'linkUrl',
          title: 'Banner Button Link',
          description: 'Where clicking the banner sends visitors (e.g. "/events").',
          type: 'string'
        }
      ]
    },
    {
      name: 'hero',
      title: 'Homepage Hero Section',
      description: 'Controls everything shown in the top hero section of the live homepage.',
      type: 'object',
      group: 'hero',
      fields: [
        {
          name: 'titleLine1',
          title: 'Headline Line 1',
          type: 'string',
          initialValue: 'You Are'
        },
        {
          name: 'titleAccentWord',
          title: 'Headline Colored Gradient Word(s)',
          type: 'string',
          initialValue: 'Always Welcome'
        },
        {
          name: 'titleLine2',
          title: 'Headline Line 2',
          type: 'string',
          initialValue: 'Here.'
        },
        {
          name: 'subtitle',
          title: 'Hero Welcome Paragraph',
          type: 'text',
          rows: 3
        },
        {
          name: 'primaryCtaText',
          title: 'Primary Button Label',
          type: 'string',
          initialValue: 'Explore Free Programs'
        },
        {
          name: 'primaryCtaLink',
          title: 'Primary Button Destination',
          type: 'string',
          initialValue: '/programs'
        },
        {
          name: 'secondaryCtaText',
          title: 'Secondary Button Label',
          type: 'string',
          initialValue: 'Visit Sanctuary'
        },
        {
          name: 'secondaryCtaLink',
          title: 'Secondary Button Destination',
          type: 'string',
          initialValue: '/programs/community-resource-center'
        },
        {
          name: 'emailAddress',
          title: 'Hero Email Icon Address',
          description: 'Email opened when visitors click the circular email icon button in the Hero.',
          type: 'string',
          initialValue: 'info@diversitycollective.org'
        },
        {
          name: 'spotlightImage',
          title: 'Hero Spotlight Photo (Delivered via Sanity CDN)',
          description: 'Upload a photo directly here; it automatically streams from Sanity CDN.',
          type: 'image',
          options: { hotspot: true }
        },
        {
          name: 'cardTitle',
          title: 'Spotlight Photo Title',
          type: 'string',
          initialValue: 'Ventura County Community Sanctuary'
        },
        {
          name: 'cardSubtitle',
          title: 'Spotlight Photo Subtitle',
          type: 'string',
          initialValue: '2471 Portola Rd, Suite 100 · Open Mon–Fri 1:00–5:00 PM'
        },
        {
          name: 'helplineText',
          title: 'Helpline Strip Text',
          type: 'string',
          initialValue: 'Need immediate care? 988 (24/7 Lifeline) · The Trevor Project: (866) 488-7386'
        },
        {
          name: 'heroTheme',
          title: 'Hero Layout Design',
          type: 'string',
          options: {
            list: [
              { title: 'Design 1: Flagship Aurora Ribbon (Default)', value: 'aurora' },
              { title: 'Design 2: Civic Sanctuary & 3D Spotlight Pathfinder', value: 'spotlight' },
              { title: 'Design 3: Sanctuary Navigator Portal', value: 'portal' },
              { title: 'Design 4: Bento Editorial Grid', value: 'bento' },
              { title: 'Design 5: Community Story Mosaic', value: 'mosaic' },
              { title: 'Design 6: Modern Architectural Split', value: 'architectural' }
            ]
          },
          initialValue: 'spotlight'
        }
      ]
    },
    {
      name: 'theme',
      title: 'Site Colors, Buttons & Typography',
      description: 'Edit button colors, text colors on buttons, corner roundness, and global fonts.',
      type: 'object',
      group: 'theme',
      fields: [
        {
          name: 'btnPrimaryBg',
          title: 'Primary Button Background (Hex)',
          type: 'string',
          initialValue: '#5A1E65'
        },
        {
          name: 'btnPrimaryText',
          title: 'Primary Button Font Color (Hex)',
          type: 'string',
          initialValue: '#FFFFFF'
        },
        {
          name: 'btnSecondaryBg',
          title: 'Secondary Button Background (Hex)',
          type: 'string',
          initialValue: '#FFFFFF'
        },
        {
          name: 'btnSecondaryText',
          title: 'Secondary Button Font Color (Hex)',
          type: 'string',
          initialValue: '#0F172A'
        },
        {
          name: 'btnDonateBg',
          title: 'Donate Button Color (Hex)',
          type: 'string',
          initialValue: '#FBBF24'
        },
        {
          name: 'btnDonateText',
          title: 'Donate Button Font Color (Hex)',
          type: 'string',
          initialValue: '#020617'
        },
        {
          name: 'navBtnText',
          title: 'Nav Bar Button Font Color (Hex)',
          description: 'Text color for top navigation bar buttons (About, Programs, Community, Events, Resources, More).',
          type: 'string',
          initialValue: '#000000'
        },
        {
          name: 'navBtnActiveBg',
          title: 'Nav Bar Active/Hover Background (Hex)',
          description: 'Pill background color for active or hovered top navigation buttons.',
          type: 'string',
          initialValue: '#5A1E65'
        },
        {
          name: 'navBtnActiveText',
          title: 'Nav Bar Active/Hover Font Color (Hex)',
          description: 'Text color for active or hovered top navigation buttons.',
          type: 'string',
          initialValue: '#FFFFFF'
        },
        {
          name: 'btnPrimaryRadius',
          title: 'Button Corner Style',
          type: 'string',
          options: {
            list: [
              { title: 'Full Pill (9999px)', value: '9999px' },
              { title: 'Modern Rounded (16px)', value: '16px' },
              { title: 'Subtle Square (8px)', value: '8px' }
            ]
          },
          initialValue: '9999px'
        },
        {
          name: 'cardRadius',
          title: 'Card Corner Style',
          type: 'string',
          options: {
            list: [
              { title: 'Architectural (16px)', value: '16px' },
              { title: 'Luxury Smooth (24px)', value: '24px' },
              { title: 'Soft Pill (32px)', value: '32px' }
            ]
          },
          initialValue: '24px'
        },
        {
          name: 'headingFont',
          title: 'Heading Font Family',
          type: 'string',
          options: {
            list: [
              { title: 'Plus Jakarta Sans (Modern Crisp Sans)', value: 'Plus Jakarta Sans' },
              { title: 'Playfair Display (Elegant Serif)', value: 'Playfair Display' },
              { title: 'Fraunces (Warm Editorial Serif)', value: 'Fraunces' },
              { title: 'Newsreader (Journalistic Serif)', value: 'Newsreader' },
              { title: 'Lora (Warm Balanced Serif)', value: 'Lora' },
              { title: 'Inter (Geometric Clarity)', value: 'Inter' }
            ]
          },
          initialValue: 'Plus Jakarta Sans'
        },
        {
          name: 'bodyFont',
          title: 'Body Font Family',
          type: 'string',
          options: {
            list: [
              { title: 'Plus Jakarta Sans (Modern Crisp Sans)', value: 'Plus Jakarta Sans' },
              { title: 'Inter (Clean Readability)', value: 'Inter' },
              { title: 'Lora (Literary Serif)', value: 'Lora' },
              { title: 'Newsreader (Newspaper Clarity)', value: 'Newsreader' }
            ]
          },
          initialValue: 'Plus Jakarta Sans'
        }
      ]
    },
    {
      name: 'sections',
      title: 'Homepage Section Order & Visibility',
      description: 'Drag and drop items to reorder sections on the homepage, or toggle Visible off to hide a section.',
      type: 'array',
      group: 'sections',
      of: [
        {
          type: 'object',
          name: 'sectionBlock',
          title: 'Homepage Section',
          fields: [
            {
              name: 'sectionId',
              title: 'Section Key',
              type: 'string',
              options: {
                list: [
                  { title: 'Hero Sanctuary Banner (hero_banner)', value: 'hero_banner' },
                  { title: 'Impact Stats Band (impact_stats)', value: 'impact_stats' },
                  { title: 'Affirming Business Directory CTA (directory_cta)', value: 'directory_cta' },
                  { title: 'Core Programs Showcase (programs_section)', value: 'programs_section' },
                  { title: 'Upcoming Community Events (events_section)', value: 'events_section' },
                  { title: 'Zeffy 0% Fee Giving Appeal (zeffy_giving)', value: 'zeffy_giving' },
                  { title: 'P.R.I.D.E. Training CTA (training_cta)', value: 'training_cta' },
                  { title: 'Voices & Sponsors Strip (community_voices)', value: 'community_voices' },
                  { title: 'Community Newsletter Signup (newsletter_section)', value: 'newsletter_section' }
                ]
              }
            },
            {
              name: 'label',
              title: 'Section Name',
              type: 'string'
            },
            {
              name: 'visible',
              title: 'Visible on Website?',
              type: 'boolean',
              initialValue: true
            }
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'sectionId',
              visible: 'visible'
            },
            prepare({ title, subtitle, visible }) {
              return {
                title: title || subtitle,
                subtitle: `${subtitle} · ${visible === false ? 'Hidden' : 'Visible'}`
              };
            }
          }
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'orgName',
      subtitle: 'tagline'
    }
  }
};
