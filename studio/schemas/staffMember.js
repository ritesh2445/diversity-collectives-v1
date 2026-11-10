export default {
  name: 'staffMember',
  title: 'DCVC Staff Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      description: 'First and last name.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'title',
      title: 'Job Title',
      description: 'Official position (e.g. Executive Director, Youth Programs Coordinator).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'department',
      title: 'Department',
      description: 'Team (e.g. Leadership, Youth Services, Community Health, Operations).',
      type: 'string',
      initialValue: 'Operations'
    },
    {
      name: 'photo',
      title: 'Staff Photo',
      description: 'Headshot or welcoming portrait.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'bio',
      title: 'About Them',
      description: 'A friendly bio explaining their role and community dedication.',
      type: 'text',
      rows: 4
    },
    {
      name: 'email',
      title: 'Staff Email',
      description: 'Direct contact email at diversitycollective.org.',
      type: 'string'
    },
    {
      name: 'order',
      title: 'Order on Website',
      description: 'Lower numbers appear first.',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'title',
      media: 'photo'
    }
  }
};
