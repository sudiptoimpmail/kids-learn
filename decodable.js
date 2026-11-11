/* Decodable words: a reading word is used only once its spelling pattern has been taught.
   The stages and which stage each reading activity level allows are data (data/lessons.json "decodable").
     wordStage('fish') → 'digraphs' · wordStage('cake') → 'magicE' · decodableAt('cvc', 2) → 'short'
     graphemes('fish') → ['f', 'i', 'sh']   (the sounds a child says when sounding the word out) */
const Decodable = (() => {
  const D = ContentData.get('lessons', 'decodable');
  const RANK = Object.fromEntries(D.stages.map((s, i) => [s, i]));
  const IRREGULAR = new Set(D.irregular);
  const DIG = D.graphemes.digraphs.slice().sort((a, b) => b.length - a.length);
  const TEAMS = D.graphemes.teams.slice().sort((a, b) => b.length - a.length);
  const VOWEL = /[aeiou]/;
  // split a word into the units a child sounds out (longest match first)
  function graphemes(word) {
    const w = String(word).toLowerCase(), out = [];
    for (let i = 0; i < w.length;) {
      const unit = [...TEAMS, ...DIG].filter((g) => w.startsWith(g, i)).sort((a, b) => b.length - a.length)[0];
      out.push(unit || w[i]); i += unit ? unit.length : 1;
    }
    return out;
  }
  function wordStage(word) {
    const w = String(word).toLowerCase();
    if (!/^[a-z]+$/.test(w) || IRREGULAR.has(w)) return 'any';
    const g = graphemes(w);
    let stage = 'short';
    const up = (s) => { if (RANK[s] > RANK[stage]) stage = s; };
    if (g.some((u) => TEAMS.includes(u))) up('teams');
    if (/[^aeiou]y$/.test(w) || /^y[^aeiou]/.test(w)) up('teams');                    // fly, sky: y as a vowel
    if (w.length >= 3 && /[aeiou][^aeiouy]e$/.test(w) && !/[aeiou]{2}/.test(w)) up('magicE');   // cake, kite, ice
    if (g.some((u) => DIG.includes(u))) up('digraphs');
    // two consonant letters next to each other that are not one sound: a blend (frog, ant, milk)
    for (let i = 0; i < g.length - 1; i++) if (g[i].length === 1 && g[i + 1].length === 1 && !VOWEL.test(g[i]) && !VOWEL.test(g[i + 1]) && g[i] !== 'y' && g[i + 1] !== 'y') {
      // a final two-consonant blend after one short vowel (ant, mud? no) is still sounded letter by letter
      up(w.length <= 3 ? 'short' : 'digraphs');
    }
    // only one vowel letter: a closed syllable; more than one vowel group and no pattern above: two syllables
    if (stage === 'short' && (w.match(/[aeiou]+/g) || []).length > 1) up('any');
    if (stage === 'short' && !VOWEL.test(w)) up('any');
    return stage;
  }
  const decodableAt = (kind, level) => (D.levels[kind] && D.levels[kind][String(level)]) || null;
  const allowed = (word, stage) => !stage || RANK[wordStage(word)] <= RANK[stage];
  // keep the pool's words the child can sound out at this level (the pool may be [word, picture] pairs)
  function filterPool(pool, kind, level) {
    const stage = decodableAt(kind, level);
    if (!stage) return pool;
    return pool.filter((x) => allowed(Array.isArray(x) ? x[0] : x, stage));
  }
  return Object.freeze({ graphemes, wordStage, decodableAt, allowed, filterPool, stages: D.stages.slice() });
})();
