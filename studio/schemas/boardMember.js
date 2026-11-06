export default {
  name: 'boardMember',
  title: 'Board of Directors Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'role',
      title: 'Board Role / Office',
      type: 'string',
      description: 'e.g., President, Vice President, Treasurer, Secretary, Director at Large',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'photo',
      title: 'Headshot Photo',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 4
    },
    {
      name: 'term',
      title: 'Term Years',
      type: 'string'
    },
    {
      name: 'isOfficer',
      title: 'Executive Officer',
      type: 'boolean',
      initialValue: false
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
      subtitle: 'role',
      media: 'photo'
    }
  }
};

