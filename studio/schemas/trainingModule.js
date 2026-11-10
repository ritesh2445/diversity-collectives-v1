export default {
  name: 'trainingModule',
  title: 'P.R.I.D.E. Training Course',
  type: 'document',
  fields: [
    {
      name: 'code',
      title: 'Course Code',
      description: 'Short catalog code (e.g. PRIDE-101, PRIDE-201).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'title',
      title: 'Course Name',
      description: 'The title of the workshop or cultural competency module.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Web Address (Slug)',
      description: 'URL path on the website (e.g. pride-101-workplace). Click Generate.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'duration',
      title: 'Course Length',
      description: 'e.g. 2 Hours, Half-Day, or Full-Day Intensive.',
      type: 'string'
    },
    {
      name: 'audience',
      title: 'Who Is This For?',
      description: 'Target workplaces, clinics, educators, or corporate leaders.',
      type: 'string'
    },
    {
      name: 'format',
      title: 'How Is It Held?',
      description: 'Select available delivery methods.',
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
      title: 'Course Overview',
      description: 'Plain-English summary of what this training covers.',
      type: 'text',
      rows: 4
    },
    {
      name: 'learningObjectives',
      title: 'What You Will Learn',
      description: 'Clear bullet points of practical skills and takeaways.',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'curriculum',
      title: 'Curriculum Sections',
      description: 'The topics or modules covered during the training.',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'ceus',
      title: 'Continuing Education (CEU Credits)',
      description: 'Professional units or certificates awarded (if any).',
      type: 'string'
    },
    {
      name: 'feeStructure',
      title: 'Cost & Nonprofit Pricing',
      description: 'Pricing guidance or nonprofit sliding-scale details.',
      type: 'string'
    },
    {
      name: 'order',
      title: 'Order on Website',
      description: 'Lower numbers show first (e.g. 1, 2, 3).',
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
