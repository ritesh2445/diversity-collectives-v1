// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — BIONIC / SYLLABLE ANCHOR READER
// Bolds the initial fixation stem of words inside <main> to help dyslexic
// and neurodivergent readers track word boundaries effortlessly.
// Safely restores original DOM Text nodes when disabled.
// ==========================================================================

const BIONIC_WRAPPER_CLASS = 'a11y-bionic-word';
const BIONIC_LEAD_CLASS = 'a11y-bionic-lead';

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
  const wrapped = root.querySelectorAll(`.${BIONIC_WRAPPER_CLASS}`);
  wrapped.forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(span.textContent || '');
    parent.replaceChild(textNode, span);
  });
  root.normalize();
}

export function applyBionicReading(enabled, root = typeof document !== 'undefined' ? document.querySelector('main') : null) {
  if (!root || typeof document === 'undefined') return;

  // Always clean prior transforms first so re-runs stay idempotent
  clearBionicReading(root);
  if (!enabled) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('.a11y-toolbar-isolated, .recite-toolbar-isolated, [aria-hidden="true"]')) {
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

    const fragment = document.createDocumentFragment();
    tokens.forEach((part) => {
      if (!part) return;
      if (/^[A-Za-zÀ-ÿ]+$/.test(part) && part.length >= 2) {
        const splitAt = getFixationLength(part);
        const wrapper = document.createElement('span');
        wrapper.className = BIONIC_WRAPPER_CLASS;

        const lead = document.createElement('strong');
        lead.className = BIONIC_LEAD_CLASS;
        lead.textContent = part.slice(0, splitAt);

        wrapper.appendChild(lead);
        wrapper.appendChild(document.createTextNode(part.slice(splitAt)));
        fragment.appendChild(wrapper);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    node.parentNode?.replaceChild(fragment, node);
  });
}

