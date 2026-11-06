export default {
  name: 'program',
  title: 'Program / Service',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Program Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'chapter',
      title: 'Chapter Number (e.g. 01, 02)',
      type: 'string'
    },
    {
      name: 'tagline',
      title: 'Short Tagline',
      type: 'string'
    },
    {
      name: 'summary',
      title: 'Brief Summary',
      type: 'text',
      rows: 3
    },
    {
      name: 'description',
      title: 'Full Program Description',
      type: 'text',
      rows: 6
    },
    {
      name: 'audience',
      title: 'Target Audience / Eligibility',
      type: 'string'
    },
    {
      name: 'schedule',
      title: 'Schedule / Meeting Times',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Location / Meeting Place',
      type: 'string'
    },
    {
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'accentColor',
      title: 'Brand Accent Hex Color',
      type: 'string',
      initialValue: '#5A1E65'
    },
    {
      name: 'amenities',
      title: 'Key Offerings & Amenities',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'contactEmail',
      title: 'Program Inquiries Email',
      type: 'string'
    },
    {
      name: 'contactPhone',
      title: 'Program Phone',
      type: 'string'
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'schedule',
      media: 'heroImage'
    }
  }
};

