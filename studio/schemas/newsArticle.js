export default {
  name: 'newsArticle',
  title: 'Community News & Story',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Story Title',
      description: 'The headline for this announcement or story.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Web Address (Slug)',
      description: 'URL path on the website (e.g. pride-2026-dates-announced). Click Generate.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'publishedAt',
      title: 'Date Published',
      description: 'The date this article goes live.',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'coverImage',
      title: 'Featured Image',
      description: 'Main article photo.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'excerpt',
      title: 'Short Summary',
      description: 'One or two sentences summarizing the news for previews and search engines.',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required()
    },
    {
      name: 'author',
      title: 'Author Name',
      description: 'Name or team who wrote the article (e.g. DCVC Communications Team).',
      type: 'string',
      initialValue: 'DCVC Communications'
    },
    {
      name: 'readingTime',
      title: 'Read Time',
      description: 'Estimated reading time (e.g. "3 min read").',
      type: 'string',
      initialValue: '3 min read'
    },
    {
      name: 'body',
      title: 'Full Story Content',
      description: 'The complete article body text.',
      type: 'text',
      rows: 10
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'author',
      media: 'coverImage'
    }
  }
};
