export default {
  name: 'boardMember',
  title: 'Board of Directors Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      description: 'First and last name (and any credentials, e.g. MSW, PhD).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'role',
      title: 'Board Role',
      description: 'Position on the board (e.g. Board President, Vice President, Treasurer, Secretary, Member at Large).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'photo',
      title: 'Profile Photo',
      description: 'Headshot or portrait photo.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'bio',
      title: 'Short Biography',
      description: 'A brief, warm summary of their background, professional expertise, and passion for DCVC.',
      type: 'text',
      rows: 4
    },
    {
      name: 'order',
      title: 'Order on Website',
      description: 'Lower numbers appear first (e.g. 1 for President, 2 for Vice President).',
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
