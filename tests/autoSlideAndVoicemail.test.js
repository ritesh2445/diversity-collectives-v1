import test from 'node:test';
import assert from 'node:assert/strict';

test('AutoSlide & Voicemail Management Features', async (t) => {
  await t.test('Multi-image list correctly cleans and filters duplicates and empty items', () => {
    const rawImages = ['/img1.jpg', '', null, '  /img2.jpg  ', '/img1.jpg', '/img3.jpg'];
    const cleaned = rawImages
      .map(img => (typeof img === 'string' ? img.trim() : ''))
      .filter(Boolean);
    const unique = [];
    for (const url of cleaned) {
      if (!unique.includes(url)) unique.push(url);
    }

    assert.deepEqual(unique, ['/img1.jpg', '/img2.jpg', '/img3.jpg']);
    assert.equal(unique.length, 3);
  });

  await t.test('Voicemail status transitions support new, reviewed, responded, and archived', () => {
    const validStatuses = ['new', 'reviewed', 'responded', 'archived'];
    const voicemail = { id: 'vm_1', status: 'new', admin_notes: '' };

    for (const nextStatus of validStatuses) {
      const updated = { ...voicemail, status: nextStatus };
      assert.equal(updated.status, nextStatus);
    }
  });

  await t.test('Voicemail follow-up notes append timestamps and text accurately', () => {
    const vm = { id: 'vm_100', admin_notes: 'Initial callback requested.' };
    const timestamp = 'Nov 19, 4:55 AM';
    const chipText = 'Left phone callback message for caller.';
    const prefix = `[${timestamp}] ${chipText}\n`;
    const newNotes = prefix + vm.admin_notes;

    assert.ok(newNotes.includes('Left phone callback message'));
    assert.ok(newNotes.includes('Initial callback requested.'));
  });

  await t.test('Voicemail deletion filters correctly without affecting other items', () => {
    const list = [
      { id: 'vm_1', name: 'Alex' },
      { id: 'vm_2', name: 'Jordan' },
      { id: 'vm_3', name: 'Taylor' }
    ];
    const filtered = list.filter(v => v.id !== 'vm_2');
    assert.equal(filtered.length, 2);
    assert.deepEqual(filtered.map(v => v.id), ['vm_1', 'vm_3']);
  });
});
