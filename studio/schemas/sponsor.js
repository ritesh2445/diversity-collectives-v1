export default {
  name: 'sponsor',
  title: 'Community Sponsor & Ally',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Partner or Sponsor Name',
      description: 'Official corporate, foundation, or organization name.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'shortName',
      title: 'Short Name',
      description: 'Brief name for buttons or badges.',
      type: 'string'
    },
    {
      name: 'tier',
      title: 'Sponsorship Level',
      description: 'Select the contribution level.',
      type: 'string',
      options: {
        list: [
          { title: 'Visionary Benefactor ($500+)', value: 'Visionary Benefactor' },
          { title: 'Rainbow Champion ($150 – $499)', value: 'Rainbow Champion' },
          { title: 'Pride Advocate ($50 – $149)', value: 'Pride Advocate' },
          { title: 'Community Ally ($1 – $49)', value: 'Community Ally' },
          { title: 'Healthcare Partner', value: 'Healthcare Partner' },
          { title: 'Founding Partner', value: 'Founding Partner' }
        ]
      },
      initialValue: 'Community Ally'
    },
    {
      name: 'logo',
      title: 'Partner Logo',
      description: 'Transparent PNG or SVG logo.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'role',
      title: 'Partnership Role',
      description: 'Brief description of partnership (e.g. Clinical Partner, Official Festival Benefactor).',
      type: 'string'
    },
    {
      name: 'url',
      title: 'Website Link',
      description: 'Web link to the partner or sponsor website.',
      type: 'url'
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
      subtitle: 'tier',
      media: 'logo'
    }
  }
};
