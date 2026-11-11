export default {
  name: 'event',
  title: 'Community Event',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Event Name',
      description: 'The headline name for this event (e.g. Ventura County Pride 2026).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Web Address (Slug)',
      description: 'The URL path on the website (e.g. pride-festival-2026). Click Generate.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: 'date',
      title: 'Date Text',
      description: 'Clear date string (e.g. Saturday, August 15, 2026 or OCT 05, 2026).',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'month',
      title: 'Month Badge (3 Letters)',
      description: 'Short month badge for cards (e.g. OCT, NOV).',
      type: 'string'
    },
    {
      name: 'day',
      title: 'Day Number (2 Digits)',
      description: 'Day number for calendar cards (e.g. 05, 19).',
      type: 'string'
    },
    {
      name: 'year',
      title: 'Year',
      description: '4-digit year (e.g. 2026).',
      type: 'string',
      initialValue: '2026'
    },
    {
      name: 'time',
      title: 'Time',
      description: 'Start and end time (e.g. 11:00 AM – 6:00 PM).',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Venue Name',
      description: 'Park or venue name.',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'address',
      title: 'Street Address',
      description: 'Full street address for maps.',
      type: 'string'
    },
    {
      name: 'category',
      title: 'Event Category',
      description: 'Choose the theme of this event.',
      type: 'string',
      options: {
        list: [
          { title: 'Youth & Family', value: 'Youth' },
          { title: 'Health & Wellness', value: 'Health' },
          { title: 'Pride & Culture', value: 'Culture' },
          { title: 'Education & Training', value: 'Education' },
          { title: 'Support & Community', value: 'Support' }
        ]
      }
    },
    {
      name: 'image',
      title: 'Event Flyer or Photo',
      description: 'Event banner or promotional flyer.',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'description',
      title: 'Event Details',
      description: 'Full description of entertainment, guest speakers, activities, and schedule.',
      type: 'text',
      rows: 5
    },
    {
      name: 'isRecurring',
      title: 'Does this event repeat?',
      description: 'Turn this on if this event happens regularly.',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'recurrenceRule',
      title: 'How often does it repeat?',
      description: 'For example: "Every 1st & 3rd Friday" or "Every Tuesday at 4 PM".',
      type: 'string',
      hidden: ({ document }) => !document?.isRecurring
    },
    {
      name: 'isCancelled',
      title: 'Is this event cancelled?',
      description: 'Turn on to display an urgent cancellation banner on the event card.',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'cancellationReason',
      title: 'Cancellation Notice',
      description: 'Brief explanation for community members why this event is postponed or cancelled.',
      type: 'string',
      hidden: ({ document }) => !document?.isCancelled
    },
    {
      name: 'registrationUrl',
      title: 'RSVP / Ticket Link',
      description: 'Web link where attendees can RSVP, register, or purchase tickets.',
      type: 'url'
    },
    {
      name: 'capacity',
      title: 'Attendee Limit',
      description: 'Maximum number of participants (leave blank if unlimited).',
      type: 'number'
    },
    {
      name: 'featured',
      title: 'Feature on Homepage?',
      description: 'Highlight this event in featured sections.',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'order',
      title: 'Display Order',
      description: 'Lower numbers appear first.',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'date',
      media: 'image'
    }
  }
};
