import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'Diversity Collective CMS Studio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6abul0sq',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content Management')
          .items([
            S.listItem()
              .title('Organization & Governance')
              .child(
                S.list()
                  .title('Organization')
                  .items([
                    S.documentTypeListItem('siteSettings').title('Site Settings & Global Info'),
                    S.documentTypeListItem('boardMember').title('Board of Directors'),
                    S.documentTypeListItem('staffMember').title('Staff Directory'),
                    S.documentTypeListItem('sponsor').title('Sponsors & Partners')
                  ])
              ),
            S.divider(),
            S.listItem()
              .title('Programs & Education')
              .child(
                S.list()
                  .title('Programs & Education')
                  .items([
                    S.documentTypeListItem('program').title('Programs & Services'),
                    S.documentTypeListItem('trainingModule').title('P.R.I.D.E. Training Catalog')
                  ])
              ),
            S.divider(),
            S.listItem()
              .title('Community & Editorial')
              .child(
                S.list()
                  .title('Editorial Content')
                  .items([
                    S.documentTypeListItem('event').title('Calendar Events'),
                    S.documentTypeListItem('newsArticle').title('News & Stories'),
                    S.documentTypeListItem('galleryItem').title('Community Photo Gallery'),
                    S.documentTypeListItem('resource').title('Community Resources')
                  ])
              )
          ])
    })
  ],

  schema: {
    types: schemaTypes
  }
});

