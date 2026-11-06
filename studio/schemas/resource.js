export default {
  name: 'resource',
  title: 'Community Resource Entry',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Organization / Service Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'category',
      title: 'Resource Category',
      type: 'string',
      options: {
        list: [
          { title: 'Crisis & Mental Health', value: 'Crisis' },
          { title: 'Housing & Food Assistance', value: 'Housing' },
          { title: 'Legal & Advocacy', value: 'Legal' },
          { title: 'Healthcare & Gender-Affirming Care', value: 'Healthcare' },
          { title: 'Youth & Family Services', value: 'Youth' },
          { title: 'Senior & Elder Services', value: 'Seniors' }
        ]
      },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'description',
      title: 'Service Description & Eligibility',
      type: 'text',
      rows: 3
    },
    {
      name: 'phone',
      title: 'Contact Phone',
      type: 'string'
    },
    {
      name: 'website',
      title: 'Website Link',
      type: 'url'
    },
    {
      name: 'address',
      title: 'Physical Address',
      type: 'string'
    },
    {
      name: 'city',
      title: 'City',
      type: 'string'
    },
    {
      name: 'spanishAvailable',
      title: 'Spanish-Language Services Available',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'isFreeOrSlidingScale',
      title: 'Free or Sliding Scale Offered',
      type: 'boolean',
      initialValue: true
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category'
    }
  }
};

