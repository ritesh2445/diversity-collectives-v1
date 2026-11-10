export default {
  name: 'siteSettings',
  title: 'Site Settings & Information',
  type: 'document',
  fields: [
    {
      name: 'orgName',
      title: 'Organization Name',
      description: 'Official nonprofit legal name.',
      type: 'string',
      initialValue: 'Diversity Collective Ventura County'
    },
    {
      name: 'tagline',
      title: 'Mission Tagline',
      description: 'The core welcoming motto shown across headers and footers.',
      type: 'string',
      initialValue: 'You Are Welcome Here.'
    },
    {
      name: 'ein',
      title: 'Tax EIN Number',
      description: '501(c)(3) federal tax identification number.',
      type: 'string',
      initialValue: '46-5312131'
    },
    {
      name: 'phone',
      title: 'Main Phone Number',
      description: 'Helpline and front desk telephone.',
      type: 'string',
      initialValue: '(805) 644-5428'
    },
    {
      name: 'email',
      title: 'Main Contact Email',
      description: 'General inquiries email.',
      type: 'string',
      initialValue: 'info@diversitycollective.org'
    },
    {
      name: 'address',
      title: 'Sanctuary Address',
      description: 'Physical location of the Community Resource Center.',
      type: 'string',
      initialValue: '2471 Portola Road, Suite 100, Ventura, CA 93003'
    },
    {
      name: 'hours',
      title: 'Center Hours',
      description: 'Weekly operating hours for visitors.',
      type: 'string',
      initialValue: 'Monday – Friday, 1:00 PM – 5:00 PM'
    },
    {
      name: 'announcementBanner',
      title: 'Top Announcement Banner',
      description: 'Urgent notices or festival announcements pinned to the very top of the website.',
      type: 'object',
      fields: [
        { 
          name: 'enabled', 
          title: 'Show Banner?', 
          description: 'Toggle on to make the banner visible.',
          type: 'boolean', 
          initialValue: false 
        },
        { 
          name: 'text', 
          title: 'Banner Message', 
          description: 'Short headline (e.g. "Ventura County Pride 2026 Vendor Sign-Ups Are Now Open!").',
          type: 'string' 
        },
        { 
          name: 'linkUrl', 
          title: 'Banner Button Link', 
          description: 'Where the banner button sends visitors (e.g. "/events" or external link).',
          type: 'string' 
        }
      ]
    }
  ]
};
