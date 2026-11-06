export default {
  name: 'event',
  title: 'Community Event',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Event Title',
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
      name: 'date',
      title: 'Date String / Schedule',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'time',
      title: 'Time',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Location & Address',
      type: 'string',
      validation: (Rule) => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
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
      title: 'Event Image / Flyer',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'description',
      title: 'Event Description',
      type: 'text',
      rows: 5
    },
    {
      name: 'isRecurring',
      title: 'Is Recurring Event',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'recurrenceRule',
      title: 'Recurrence Rule (e.g. Weekly on Friday)',
      type: 'string',
      hidden: ({ document }) => !document?.isRecurring
    },
    {
      name: 'isCancelled',
      title: 'Event Cancelled Notice',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'cancellationReason',
      title: 'Cancellation Notice Text',
      type: 'string',
      hidden: ({ document }) => !document?.isCancelled
    },
    {
      name: 'registrationUrl',
      title: 'External Registration Link',
      type: 'url'
    },
    {
      name: 'capacity',
      title: 'Attendee Capacity',
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

