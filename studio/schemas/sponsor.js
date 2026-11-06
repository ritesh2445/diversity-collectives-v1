export default {
  name: 'sponsor',
  title: 'Sponsor & Partner',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Partner / Organization Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'tier',
      title: 'Partnership Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Founding Benefactor', value: 'Founding' },
          { title: 'Community Champion', value: 'Champion' },
          { title: 'Civic & Institutional Ally', value: 'Civic' },
          { title: 'Local Business Supporter', value: 'Business' }
        ]
      },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'logo',
      title: 'Partner Logo',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'website',
      title: 'Partner Website URL',
      type: 'url'
    },
    {
      name: 'description',
      title: 'Short Statement / Contribution',
      type: 'text',
      rows: 2
    },
    {
      name: 'isActive',
      title: 'Active Partner',
      type: 'boolean',
      initialValue: true
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'tier',
      media: 'logo'
    }
  }
};

