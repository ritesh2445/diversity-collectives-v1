import test from 'node:test';
import assert from 'node:assert/strict';

import { lockScroll, unlockScroll } from '../src/utils/scrollLock.js';

test('ScrollLock Manager sets body and html overflow to hidden with reference counting', () => {
  // Mock global document if not present
  const originalDocument = globalThis.document;

  const mockDoc = {
    documentElement: {
      style: {
        overflow: '',
        overscrollBehavior: ''
      }
    },
    body: {
      style: {
        overflow: '',
        overscrollBehavior: '',
        touchAction: ''
      }
    }
  };

  globalThis.document = mockDoc;

  try {
    // 1. Lock scroll
    lockScroll();
    assert.equal(mockDoc.documentElement.style.overflow, 'hidden');
    assert.equal(mockDoc.documentElement.style.overscrollBehavior, 'none');
    assert.equal(mockDoc.body.style.overflow, 'hidden');
    assert.equal(mockDoc.body.style.touchAction, 'none');
    assert.equal(mockDoc.body.style.overscrollBehavior, 'none');

    // 2. Nested second lock (e.g. modal opens another dialog)
    lockScroll();
    assert.equal(mockDoc.documentElement.style.overflow, 'hidden');
    assert.equal(mockDoc.body.style.overflow, 'hidden');

    // 3. Unlock once -> should still be locked
    unlockScroll();
    assert.equal(mockDoc.documentElement.style.overflow, 'hidden');
    assert.equal(mockDoc.body.style.overflow, 'hidden');

    // 4. Unlock second time -> lock count reaches 0, restores
    unlockScroll();
    assert.equal(mockDoc.documentElement.style.overflow, '');
    assert.equal(mockDoc.body.style.overflow, '');
    assert.equal(mockDoc.body.style.touchAction, '');
    assert.equal(mockDoc.body.style.overscrollBehavior, '');
  } finally {
    globalThis.document = originalDocument;
  }
});
