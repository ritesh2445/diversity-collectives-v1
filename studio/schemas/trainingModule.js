export default {
  name: 'trainingModule',
  title: 'P.R.I.D.E. Training Course',
  type: 'document',
  fields: [
    {
      name: 'code',
      title: 'Course Code (e.g. PRIDE-101)',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'title',
      title: 'Course Title',
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
      name: 'duration',
      title: 'Duration (e.g. 2 Hours, Full-Day)',
      type: 'string'
    },
    {
      name: 'audience',
      title: 'Target Audience / Sector',
      type: 'string'
    },
    {
      name: 'format',
      title: 'Available Formats',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'In-Person Workshop', value: 'In-Person' },
          { title: 'Interactive Virtual Webinar', value: 'Virtual' },
          { title: 'Hybrid Session', value: 'Hybrid' }
        ]
      }
    },
    {
      name: 'description',
      title: 'Course Description',
      type: 'text',
      rows: 4
    },
    {
      name: 'learningObjectives',
      title: 'Key Learning Objectives',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'curriculum',
      title: 'Curriculum Modules / Outline',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'ceus',
      title: 'Continuing Education Units / Credits',
      type: 'string'
    },
    {
      name: 'feeStructure',
      title: 'Fee / Pricing Guidance',
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
      title: 'title',
      subtitle: 'code'
    }
  }
};

