/* 3D pictures for emoji (Microsoft Fluent Emoji, MIT licence — assets/fluent/LICENSE-fluentui-emoji.txt).
   Every emoji the app shows on a card, a tile or a game is swapped for one bundled 3D picture,
   so all pictures share one style on every device. Flags and symbols without a picture stay as text.
   The image keeps the emoji as alt text, and nothing that answers a question reads it. */
(() => {
  'use strict';
  let MAP = null;
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
  const EMOJI = /\p{Extended_Pictographic}/u;
  const key = (g) => [...g].filter((c) => c !== '️').map((c) => c.codePointAt(0).toString(16)).join('-');
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TITLE', 'CANVAS']);
  function swapText(node) {
    const text = node.nodeValue;
    if (!text || !EMOJI.test(text) || !seg) return;
    const parent = node.parentNode;
    if (!parent || SKIP.has(parent.nodeName) || parent.closest('svg, .no-fx, [contenteditable]')) return;
    const parts = [...seg.segment(text)].map((s) => s.segment);
    if (!parts.some((g) => MAP[key(g)])) return;
    const frag = document.createDocumentFragment();
    let run = '';
    for (const g of parts) {
      const file = EMOJI.test(g) && MAP[key(g)];
      if (!file) { run += g; continue; }
      if (run) { frag.appendChild(document.createTextNode(run)); run = ''; }
      const img = document.createElement('img');
      img.className = 'fx'; img.src = 'assets/fluent/' + file; img.alt = g; img.draggable = false; img.decoding = 'async';
      frag.appendChild(img);
    }
    if (run) frag.appendChild(document.createTextNode(run));
    parent.replaceChild(frag, node);
  }
  function walk(root) {
    if (!MAP || !root) return;
    if (root.nodeType === 3) { swapText(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.nodeName) || root.closest && root.closest('svg, .no-fx')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(swapText);
  }
  window.fluentize = walk;
  fetch('assets/fluent/manifest.json').then((r) => r.json()).then((m) => {
    MAP = m;
    walk(document.body);
    new MutationObserver((list) => {
      for (const rec of list) {
        if (rec.type === 'characterData') swapText(rec.target);
        else rec.addedNodes.forEach(walk);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }).catch(() => {});
})();
