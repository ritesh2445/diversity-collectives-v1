import { test, describe } from 'node:test';
import assert from 'node:assert';
import { cmsStore } from '../src/services/cmsStore.js';
import { podcastsSeed } from '../src/data/dcvcData.js';
import { lunaLearningEngine } from '../src/services/lunaLearningEngine.js';

describe('Podcasts & Community Media Engine', () => {
  test('initializes podcasts as an empty array when no real episodes are published', () => {
    const podcasts = cmsStore.getPodcasts();
    assert.ok(Array.isArray(podcasts), 'Podcasts should be an array');
    // The seed is intentionally empty — real episodes are managed via the Admin Panel.
    // This verifies the store returns a clean array (not null/undefined) with no fake placeholders.
    assert.ok(podcasts.every(p => !['pod-1','pod-2','pod-3','pod-4'].includes(p.id)),
      'No fake seed episodes (pod-1 through pod-4) should appear in the store');
  });

  test('creates, updates, and deletes podcast episodes via cmsStore', () => {
    const initialCount = cmsStore.getPodcasts().length;
    
    // Create new episode
    const newEp = {
      title: 'Youth Voices: Pride Prom 2026',
      episodeNumber: 99,
      category: 'Youth Voices',
      host: 'Youth Coordinator',
      guests: 'Youth Advisory Board',
      duration: '25 min',
      link: 'https://open.spotify.com/episode/test-prom',
      summary: 'Inside the planning of the countywide LGBTQ+ youth prom.'
    };
    cmsStore.savePodcast(newEp);

    const afterAdd = cmsStore.getPodcasts();
    assert.strictEqual(afterAdd.length, initialCount + 1, 'Podcast count should increment by 1');
    const addedItem = afterAdd.find(p => p.title === newEp.title);
    assert.ok(addedItem, 'Newly added episode should be found in store');
    assert.strictEqual(addedItem.link, newEp.link);

    // Edit episode
    cmsStore.savePodcast({
      ...addedItem,
      duration: '32 min'
    });
    const afterEdit = cmsStore.getPodcasts().find(p => p.id === addedItem.id);
    assert.strictEqual(afterEdit.duration, '32 min', 'Duration should be updated');

    // Delete episode
    cmsStore.deletePodcast(addedItem.id);
    const afterDelete = cmsStore.getPodcasts();
    assert.strictEqual(afterDelete.length, initialCount, 'Episode count should return to initial');
    assert.ok(!afterDelete.some(p => p.id === addedItem.id), 'Deleted episode should not exist');
  });

  test('stores, updates, and deletes community content suggestions', () => {
    const newSuggestion = {
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      category: 'Podcast Episode',
      topic: 'Nonbinary Healthcare Access in East County',
      description: 'Discussing rural healthcare clinics and gender-affirming resources in Simi Valley & Moorpark.',
      guestRecommendation: 'Dr. Jordan Vance'
    };

    const saved = cmsStore.saveMediaSuggestion(newSuggestion);
    assert.ok(saved.id, 'Saved suggestion should have a generated ID');
    assert.strictEqual(saved.status, 'new');

    const all = cmsStore.getMediaSuggestions();
    assert.ok(all.some(s => s.id === saved.id), 'Suggestion should be retrievable from store');

    // Update status to 'reviewed'
    cmsStore.updateMediaSuggestion(saved.id, { status: 'reviewed' });
    const updated = cmsStore.getMediaSuggestions().find(s => s.id === saved.id);
    assert.strictEqual(updated.status, 'reviewed');

    // Delete suggestion
    cmsStore.deleteMediaSuggestion(saved.id);
    const afterDel = cmsStore.getMediaSuggestions();
    assert.ok(!afterDel.some(s => s.id === saved.id));
  });

  test('Luna AI responds accurately to questions about podcasts and content suggestions', () => {
    lunaLearningEngine.learnFromSite(cmsStore.getAllData());
    const reply = lunaLearningEngine.answerQuery('Do you have a podcast or audio episodes?');
    assert.ok(reply.success, 'Luna should answer successfully');
    assert.ok(reply.answer.toLowerCase().includes('podcast') || reply.answer.toLowerCase().includes('audio'), 'Answer should mention podcasts');
    assert.ok(reply.citations.some(c => c.url === '/media'), 'Citation should point to /media');
  });

  test('In-Frame Media Parsing: parseMediaSource correctly detects YouTube, Spotify, Apple, and Audio', async () => {
    const { parseMediaSource } = await import('../src/utils/mediaEmbed.js');

    // 1. YouTube
    const yt = parseMediaSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(yt.type, 'youtube');
    assert.ok(yt.embedUrl.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));

    // 2. Spotify
    const sp = parseMediaSource('https://open.spotify.com/episode/7makk4oTQel546v0PZSI45');
    assert.strictEqual(sp.type, 'spotify');
    assert.ok(sp.embedUrl.includes('open.spotify.com/embed/episode/7makk4oTQel546v0PZSI45'));

    // 3. Apple Podcasts
    const ap = parseMediaSource('https://podcasts.apple.com/us/podcast/example/id123456789');
    assert.strictEqual(ap.type, 'apple');
    assert.ok(ap.embedUrl.includes('embed.podcasts.apple.com'));

    // 4. Direct Audio
    const audio = parseMediaSource('https://media.diversitycollectivevc.org/episodes/episode1.mp3');
    assert.strictEqual(audio.type, 'audio');
    assert.strictEqual(audio.src, 'https://media.diversitycollectivevc.org/episodes/episode1.mp3');
  });

  test('Safety Guard: addition or deletion of any program strictly does NOT delete events or wipe database', () => {
    const initialEvents = cmsStore.getEvents();
    assert.ok(initialEvents.length >= 5, 'Pre-populated events must exist');

    // 1. Add a program
    const newProg = {
      title: 'Youth Safe Space Coding Lab',
      tagline: 'STEM and tech community for queer youth',
      slug: 'youth-coding-lab',
      active: true
    };
    cmsStore.saveProgram(newProg);

    // Verify events were NOT deleted
    const eventsAfterProgAdd = cmsStore.getEvents();
    assert.strictEqual(eventsAfterProgAdd.length, initialEvents.length, 'Adding a program MUST NOT delete events');
    for (const evt of initialEvents) {
      assert.ok(eventsAfterProgAdd.some(e => e.id === evt.id || e.slug === evt.slug), `Event ${evt.title} must still exist`);
    }

    // 2. Delete the program
    cmsStore.deleteProgram('youth-coding-lab');

    // Verify events STILL exist and were NOT deleted
    const eventsAfterProgDelete = cmsStore.getEvents();
    assert.strictEqual(eventsAfterProgDelete.length, initialEvents.length, 'Deleting a program MUST NOT delete events');
    for (const evt of initialEvents) {
      assert.ok(eventsAfterProgDelete.some(e => e.id === evt.id || e.slug === evt.slug), `Event ${evt.title} must still exist`);
    }
  });
});
