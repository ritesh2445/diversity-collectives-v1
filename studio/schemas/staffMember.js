export default {
  name: 'staffMember',
  title: 'Staff Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'title',
      title: 'Job Title / Position',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'department',
      title: 'Department / Program Area',
      type: 'string',
      options: {
        list: [
          { title: 'Executive & Administration', value: 'Executive' },
          { title: 'Community Resource Center', value: 'Operations' },
          { title: 'Health & Wellness (SHINES)', value: 'Health' },
          { title: 'Youth Programs (Rainbow Umbrella)', value: 'Youth' },
          { title: 'Education & Training (P.R.I.D.E.)', value: 'Education' }
        ]
      }
    },
    {
      name: 'photo',
      title: 'Staff Portrait Photo',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'bio',
      title: 'Biography & Community Background',
      type: 'text',
      rows: 4
    },
    {
      name: 'email',
      title: 'Staff Inquiries Email',
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
      title: 'name',
      subtitle: 'title',
      media: 'photo'
    }
  }
};

