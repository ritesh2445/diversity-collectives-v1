export default {
  name: 'resource',
  title: 'Community Resource Entry',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Resource or Service Name',
      description: 'The name of the clinic, shelter, legal service, or crisis hotline.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'category',
      title: 'Resource Category',
      description: 'Choose where this resource belongs.',
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
      title: 'What They Help With',
      description: 'Friendly explanation of services provided and who is eligible.',
      type: 'text',
      rows: 3
    },
    {
      name: 'phone',
      title: 'Phone Number',
      description: 'Main hotline or intake telephone number.',
      type: 'string'
    },
    {
      name: 'website',
      title: 'Website Link',
      description: 'Direct link to their official website.',
      type: 'url'
    },
    {
      name: 'address',
      title: 'Street Address',
      description: 'Physical location (or write "Confidential / Countywide").',
      type: 'string'
    },
    {
      name: 'city',
      title: 'City',
      description: 'City in Ventura County or regional service area.',
      type: 'string'
    },
    {
      name: 'spanishAvailable',
      title: 'Spanish Spoken?',
      description: 'Turn on if bilingual Spanish services are offered.',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'isFreeOrSlidingScale',
      title: 'Free or Low Cost?',
      description: 'Turn on if this service is 100% free or offered on a sliding scale.',
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
