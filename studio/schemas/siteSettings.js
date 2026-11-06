export default {
  name: 'siteSettings',
  title: 'Site Settings & Global Information',
  type: 'document',
  fields: [
    {
      name: 'orgName',
      title: 'Organization Name',
      type: 'string',
      initialValue: 'Diversity Collective Ventura County'
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'You Are Welcome Here.'
    },
    {
      name: 'ein',
      title: 'Tax EIN Number',
      type: 'string',
      initialValue: '46-5312131'
    },
    {
      name: 'phone',
      title: 'Primary Phone',
      type: 'string',
      initialValue: '(805) 644-5428'
    },
    {
      name: 'email',
      title: 'General Contact Email',
      type: 'string',
      initialValue: 'info@diversitycollective.org'
    },
    {
      name: 'address',
      title: 'Headquarters Address',
      type: 'string',
      initialValue: '2471 Portola Road, Suite 100, Ventura, CA 93003'
    },
    {
      name: 'hours',
      title: 'Operating Hours Summary',
      type: 'string',
      initialValue: 'Monday – Friday, 1:00 PM – 5:00 PM'
    },
    {
      name: 'announcementBanner',
      title: 'Sitewide Announcement Banner (Optional)',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Show Banner', type: 'boolean', initialValue: false },
        { name: 'text', title: 'Banner Text', type: 'string' },
        { name: 'linkUrl', title: 'Banner Action Link', type: 'string' }
      ]
    }
  ]
};

