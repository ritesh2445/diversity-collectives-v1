import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmsStore, INITIAL_CMS_DATA } from '../src/services/cmsStore.js';
import { newsArticles } from '../src/data/dcvcData.js';

describe('News Admin Live Sync & Multi-Article Accuracy', () => {
  it('1. assigns unique, distinct identifiers to all initial news articles', () => {
    const news = cmsStore.getNews();
    assert.ok(Array.isArray(news), 'news should be an array');
    assert.ok(news.length >= 3, 'should have multiple seed articles');

    const ids = news.map(n => n.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'all news article IDs must be distinct and non-null');
  });

  it('2. updates the EXACT targeted article when saving without overwriting article 0', () => {
    const initialNews = cmsStore.getNews();
    const articleToEdit = initialNews[1]; // Edit the SECOND article (index 1)
    const article0Before = { ...initialNews[0] };

    const updatedData = {
      ...articleToEdit,
      title: 'Updated Headline For Second Article ' + Date.now(),
      excerpt: 'Updated excerpt description specifically for article 2.',
      body: '<p>Updated full rich text body for article 2.</p>'
    };

    cmsStore.saveNews(updatedData);

    const newsAfter = cmsStore.getNews();

    // Verify article 0 was NOT modified
    assert.equal(newsAfter[0].title, article0Before.title, 'Article 0 must NOT be overwritten when editing Article 1');
    assert.equal(newsAfter[0].slug, article0Before.slug, 'Article 0 slug must remain untouched');

    // Verify article 1 WAS updated with the exact new content
    const updatedArticleInStore = newsAfter.find(n => n.slug === articleToEdit.slug || n.id === articleToEdit.id);
    assert.ok(updatedArticleInStore, 'Updated article must be present in store');
    assert.equal(updatedArticleInStore.title, updatedData.title, 'Article 1 title must reflect new title');
    assert.equal(updatedArticleInStore.excerpt, updatedData.excerpt, 'Article 1 excerpt must reflect new excerpt');
    assert.equal(updatedArticleInStore.body, updatedData.body, 'Article 1 body must reflect new body');
  });

  it('3. supports creating new news articles with generated slug and id', () => {
    const newArticle = {
      title: 'Breaking Community Center Initiative 2026',
      category: 'Youth Empowerment',
      excerpt: 'New youth empowerment initiative launched in Oxnard.',
      body: '<p>Full story details here.</p>',
      author: 'DCVC Team'
    };

    cmsStore.saveNews(newArticle);

    const newsAfter = cmsStore.getNews();
    const created = newsAfter.find(n => n.title === newArticle.title);
    assert.ok(created, 'Newly created article must exist in store');
    assert.ok(created.id, 'New article must have an id');
    assert.ok(created.slug.includes('breaking-community-center-initiative'), 'Slug must be derived from title');
    assert.equal(created.category, 'Youth Empowerment');
  });

  it('4. deletes targeted news article without affecting sibling articles', () => {
    const testArticle = {
      title: 'Temporary Test Article to Delete',
      category: 'Advocacy',
      excerpt: 'Will be deleted.',
      body: 'Content'
    };

    cmsStore.saveNews(testArticle);
    const storeWithTest = cmsStore.getNews();
    const created = storeWithTest.find(n => n.title === testArticle.title);
    assert.ok(created, 'Must be created before deletion');

    cmsStore.deleteNews(created.id);

    const storeAfterDelete = cmsStore.getNews();
    const found = storeAfterDelete.find(n => n.id === created.id || n.slug === created.slug);
    assert.equal(found, undefined, 'Deleted article must no longer exist in store');
  });
});
