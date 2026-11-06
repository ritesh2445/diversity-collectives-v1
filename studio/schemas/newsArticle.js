export default {
  name: 'newsArticle',
  title: 'News & Blog Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Article Title',
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
      name: 'publishedAt',
      title: 'Publication Date',
      type: 'datetime',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'author',
      title: 'Author Name',
      type: 'string',
      initialValue: 'Diversity Collective Staff'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Community Dispatch', value: 'Community Dispatch' },
          { title: 'Press Release', value: 'Press Release' },
          { title: 'Health & Wellness', value: 'Health & Wellness' },
          { title: 'Pride Updates', value: 'Pride Updates' },
          { title: 'Advocacy & Policy', value: 'Advocacy & Policy' }
        ]
      }
    },
    {
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'summary',
      title: 'Short Excerpt / Summary',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required()
    },
    {
      name: 'body',
      title: 'Article Content',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          fields: [
            {
              type: 'text',
              name: 'alt',
              title: 'Alternative Text',
              description: 'Important for accessibility and SEO.'
            }
          ]
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
      media: 'image'
    }
  }
};

