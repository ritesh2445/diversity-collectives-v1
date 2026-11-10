export default {
  name: 'program',
  title: 'Program / Service',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Program Name',
      description: 'The official name of the program (e.g. Rainbow Umbrella, Diversity SHINES).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Web Address (Slug)',
      description: 'The URL path on the website (e.g. rainbow-umbrella). Click Generate.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'chapter',
      title: 'Chapter Number',
      description: 'Display tag like 01, 02, or 03.',
      type: 'string'
    },
    {
      name: 'tagline',
      title: 'Short Tagline',
      description: 'A memorable one-line summary.',
      type: 'string'
    },
    {
      name: 'summary',
      title: 'Quick Summary',
      description: '2 to 3 sentences explaining what this program provides.',
      type: 'text',
      rows: 3
    },
    {
      name: 'description',
      title: 'Full Details',
      description: 'The complete story, purpose, and community impact.',
      type: 'text',
      rows: 6
    },
    {
      name: 'audience',
      title: 'Who Can Join?',
      description: 'Age range and who is welcomed (e.g. LGBTQ+ youth ages 13–23).',
      type: 'string'
    },
    {
      name: 'schedule',
      title: 'When Does It Meet?',
      description: 'Meeting days and hours (e.g. Every Friday, 5:30 PM – 7:30 PM).',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Where Does It Meet?',
      description: 'Room or physical address (e.g. Community Resource Center, Ventura).',
      type: 'string'
    },
    {
      name: 'heroImage',
      title: 'Cover Photo',
      description: 'Main high-resolution photo displayed at the top of the program page.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'accentColor',
      title: 'Theme Color',
      description: 'Brand hex color code (e.g. #5A1E65).',
      type: 'string',
      initialValue: '#5A1E65'
    },
    {
      name: 'amenities',
      title: 'What We Offer',
      description: 'List of features, supplies, snacks, or resources provided.',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'contactEmail',
      title: 'Contact Email',
      description: 'Direct email for questions about this program.',
      type: 'string'
    },
    {
      name: 'contactPhone',
      title: 'Contact Phone',
      description: 'Phone number for inquiries.',
      type: 'string'
    },
    {
      name: 'order',
      title: 'Order on Website',
      description: 'Lower numbers appear first on the page (e.g. 1, 2, 3).',
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
