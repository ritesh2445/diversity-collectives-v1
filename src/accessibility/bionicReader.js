// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — BIONIC / SYLLABLE ANCHOR READER
// Bolds the initial fixation stem of words inside <main> to help dyslexic
// and neurodivergent readers track word boundaries effortlessly.
// Safely preserves React's original DOM Text nodes to prevent reconciliation errors.
// ==========================================================================

const BIONIC_GHOST_CLASS = 'a11y-bionic-ghost';
const BIONIC_WORD_CLASS = 'a11y-bionic-word';
const BIONIC_LEAD_CLASS = 'a11y-bionic-lead';
const BIONIC_TAIL_CLASS = 'a11y-bionic-tail';

const ORIGINAL_TEXT_MAP = new WeakMap();

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'CODE',
  'PRE',
  'SVG',
  'CANVAS',
  'BUTTON'
]);

function getFixationLength(word) {
  const len = word.length;
  if (len <= 1) return 1;
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  if (len <= 9) return 3;
  return Math.ceil(len * 0.42);
}

export function clearBionicReading(root = typeof document !== 'undefined' ? document.querySelector('main') : null) {
  if (!root || typeof document === 'undefined') return;

  const ghosts = root.querySelectorAll(`.${BIONIC_GHOST_CLASS}`);
  ghosts.forEach((ghost) => {
    const prev = ghost.previousSibling;
    if (prev && prev.nodeType === 3 && ORIGINAL_TEXT_MAP.has(prev)) {
      prev.nodeValue = ORIGINAL_TEXT_MAP.get(prev);
      ORIGINAL_TEXT_MAP.delete(prev);
    }
    ghost.remove();
  });
}

export function applyBionicReading(enabled, root = typeof document !== 'undefined' ? document.querySelector('main') : null) {
  if (!root || typeof document === 'undefined') return;

  if (!enabled) {
    clearBionicReading(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (
        parent.closest(
          `.${BIONIC_GHOST_CLASS}, .a11y-toolbar-isolated, .recite-toolbar-isolated, [aria-hidden="true"]`
        )
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current);
    current = walker.nextNode();
  }

  textNodes.forEach((node) => {
    const value = node.nodeValue || '';
    const tokens = value.split(/([A-Za-zÀ-ÿ]+)/);
    if (tokens.length <= 1) return;

    let hasWord = false;
    const ghost = document.createElement('span');
    ghost.className = BIONIC_GHOST_CLASS;

    tokens.forEach((part) => {
      if (!part) return;
      if (/^[A-Za-zÀ-ÿ]+$/.test(part) && part.length >= 2) {
        hasWord = true;
        const splitAt = getFixationLength(part);
        const wrapper = document.createElement('span');
        wrapper.className = BIONIC_WORD_CLASS;

        const lead = document.createElement('strong');
        lead.className = BIONIC_LEAD_CLASS;
        lead.textContent = part.slice(0, splitAt);

        const tail = document.createElement('span');
        tail.className = BIONIC_TAIL_CLASS;
        tail.textContent = part.slice(splitAt);

        wrapper.appendChild(lead);
        wrapper.appendChild(tail);
        ghost.appendChild(wrapper);
      } else {
        ghost.appendChild(document.createTextNode(part));
      }
    });

    if (!hasWord || !node.parentNode) return;

    // Keep the exact original React Text node attached inside parentNode (just empty)
    // so React state updates / unmounts can still remove or update it cleanly without NotFoundError.
    ORIGINAL_TEXT_MAP.set(node, value);
    node.nodeValue = '';
    node.parentNode.insertBefore(ghost, node.nextSibling);
  });
}
