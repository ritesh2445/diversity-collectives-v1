export default {
  name: 'galleryItem',
  title: 'Gallery Photograph',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Photo Title',
      description: 'A friendly title for the photograph or moment.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'image',
      title: 'Photograph',
      description: 'Upload high-resolution image.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'imageUrl',
      title: 'Direct Image / CDN URL',
      description: 'Direct link or jsDelivr / Cloudinary link if hosted externally.',
      type: 'string'
    },
    {
      name: 'alt',
      title: 'Image Description (For Screen Readers)',
      description: 'Describe what is in the photo so visually impaired visitors can understand it.',
      type: 'string'
    },
    {
      name: 'caption',
      title: 'Story or Quote',
      description: 'A memorable quote or short story from this community moment.',
      type: 'text',
      rows: 2
    },
    {
      name: 'eventTag',
      title: 'Which Event Was This?',
      description: 'Category for sorting in the gallery.',
      type: 'string',
      options: {
        list: [
          { title: 'Ventura County Pride', value: 'Pride' },
          { title: 'Community Resource Center', value: 'CRC' },
          { title: 'Rainbow Umbrella Youth', value: 'Rainbow Umbrella' },
          { title: 'Diversity SHINES Healthcare', value: 'SHINES' },
          { title: 'Volunteers & Mutual Aid', value: 'Volunteers' }
        ]
      }
    },
    {
      name: 'year',
      title: 'Year Taken',
      description: 'e.g. 2026, 2025, 2024.',
      type: 'string',
      initialValue: '2026'
    },
    {
      name: 'order',
      title: 'Order in Gallery',
      description: 'Lower numbers show first.',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'year',
      media: 'image'
    }
  }
};
