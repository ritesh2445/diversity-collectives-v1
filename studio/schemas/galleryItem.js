export default {
  name: 'galleryItem',
  title: 'Gallery Photograph',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Photo Title / Event Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'image',
      title: 'Photograph',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'alt',
      title: 'Accessibility Alt Text',
      type: 'string',
      description: 'Crucial for screen readers. Describe what is visible in the photograph.',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'caption',
      title: 'Display Caption',
      type: 'text',
      rows: 2
    },
    {
      name: 'eventTag',
      title: 'Event Tag / Program',
      type: 'string',
      options: {
        list: [
          { title: 'Ventura County Pride', value: 'Pride' },
          { title: 'Community Resource Center', value: 'CRC' },
          { title: 'Rainbow Umbrella Youth', value: 'Rainbow Umbrella' },
          { title: 'Diversity SHINES Gala', value: 'SHINES' },
          { title: 'Volunteer Gatherings', value: 'Volunteers' }
        ]
      }
    },
    {
      name: 'year',
      title: 'Year Taken',
      type: 'string',
      initialValue: '2024'
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
      subtitle: 'eventTag',
      media: 'image'
    }
  }
};

