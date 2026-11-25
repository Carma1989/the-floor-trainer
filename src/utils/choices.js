/**
 * Generates 3 smart A/B/C options (1 correct + 2 plausible distractors)
 * tailored to the category type so answers are never trivially obvious.
 */

const ORTHO_SWAPS = [
  ['rz', 'ż'], ['ż', 'rz'],
  ['ó', 'u'], ['u', 'ó'],
  ['ch', 'h'], ['h', 'ch'],
  ['Rz', 'Ż'], ['Ż', 'Rz'],
  ['Ó', 'U'], ['U', 'Ó'],
  ['Ch', 'H'], ['H', 'Ch'],
];

const VOWEL_SWAPS = {
  a: 'e', e: 'a', o: 'u', u: 'o', i: 'y', y: 'i',
  ą: 'ę', ę: 'ą', ó: 'o',
};

function makeOrthographyVariants(word) {
  const variants = new Set();
  for (const [from, to] of ORTHO_SWAPS) {
    let idx = word.indexOf(from);
    while (idx !== -1) {
      const candidate = word.slice(0, idx) + to + word.slice(idx + from.length);
      if (candidate.toLowerCase() !== word.toLowerCase()) {
        variants.add(candidate);
      }
      idx = word.indexOf(from, idx + 1);
    }
  }
  return [...variants];
}

function makeMirrorWordVariants(word) {
  const variants = new Set();
  const clean = word.trim();
  const chars = [...clean];
  if (chars.length >= 5) {
    // Swap two adjacent middle letters (preserves first & last letter and exact length)
    for (let i = 1; i < chars.length - 2; i++) {
      if (chars[i].toLowerCase() !== chars[i + 1].toLowerCase() && chars[i] !== ' ' && chars[i + 1] !== ' ') {
        const copy = [...chars];
        [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
        const cand = copy.join('');
        if (cand.toLowerCase() !== clean.toLowerCase()) variants.add(cand);
      }
    }
    // Replace a middle vowel with a similar vowel (preserves first & last letter)
    for (let i = 1; i < chars.length - 1; i++) {
      const low = chars[i].toLowerCase();
      if (VOWEL_SWAPS[low]) {
        const copy = [...chars];
        copy[i] = chars[i] === low ? VOWEL_SWAPS[low] : VOWEL_SWAPS[low].toUpperCase();
        const cand = copy.join('');
        if (cand.toLowerCase() !== clean.toLowerCase()) variants.add(cand);
      }
    }
  }
  return [...variants];
}

function makeCrosswordDistractors(name) {
  const m = name.match(/^([A-ZĄĆĘŁŃÓŚŹŻ])\s*(\(.+\))$/);
  if (!m) return [];
  const [, letter, rest] = m;
  const confusable = ['A', 'E', 'O', 'I', 'K', 'M', 'R', 'S', 'T', 'L', 'N', 'P', 'W', 'Z']
    .filter(l => l !== letter)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  return confusable.map(l => `${l} ${rest}`);
}

function similarityScore(targetName, candidateName) {
  const a = targetName.toLowerCase();
  const b = candidateName.toLowerCase();
  let score = 0;
  if (a[0] === b[0]) score += 5;
  if (a[a.length - 1] === b[b.length - 1]) score += 4;
  score -= Math.abs(a.length - b.length) * 0.4;
  // Shared bigrams
  const bigrams = new Set();
  for (let i = 0; i < a.length - 1; i++) bigrams.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) {
    if (bigrams.has(b.slice(i, i + 2))) score += 2;
  }
  return score;
}

export function buildSmartChoices(currentItem, categoryItems = [], fallbackPool = []) {
  if (!currentItem) return [];
  const target = currentItem.name;
  const catId = currentItem.categoryId || '';
  const basePool = categoryItems.length >= 3 ? categoryItems : fallbackPool;

  const makeOptionObj = (name, idx) => ({
    id: `opt-${idx}-${name}`,
    name,
  });

  // 1. Crossword: keep the same two words in parentheses, vary only the intersecting letter
  if (catId === 'crossword') {
    const cw = makeCrosswordDistractors(target);
    if (cw.length === 2) {
      return [currentItem, makeOptionObj(cw[0], 1), makeOptionObj(cw[1], 2)]
        .sort(() => Math.random() - 0.5);
    }
  }

  // 2. Orthography: generate plausible spelling traps (ó/u, rz/ż, ch/h)
  if (catId === 'orthography_words') {
    const ortho = makeOrthographyVariants(target).sort(() => Math.random() - 0.5);
    if (ortho.length >= 2) {
      return [currentItem, makeOptionObj(ortho[0], 1), makeOptionObj(ortho[1], 2)]
        .sort(() => Math.random() - 0.5);
    }
  }

  // 3. Wspak / Mirror: mix similar-looking word traps (same start & end letter) + closest pool words
  if (catId === 'wspak_mirror') {
    const traps = makeMirrorWordVariants(target).sort(() => Math.random() - 0.5);
    if (traps.length >= 2) {
      return [currentItem, makeOptionObj(traps[0], 1), makeOptionObj(traps[1], 2)]
        .sort(() => Math.random() - 0.5);
    }
  }

  // 4. Numeric categories (powers_geometry, roman_math): pick numerically closest distractors
  if (catId === 'powers_geometry' || catId === 'roman_math') {
    const targetNum = parseInt(target, 10);
    if (!Number.isNaN(targetNum)) {
      const numericPool = basePool
        .filter(it => it.name.toLowerCase() !== target.toLowerCase())
        .map(it => ({ item: it, num: parseInt(it.name, 10) }))
        .filter(x => !Number.isNaN(x.num))
        .sort((a, b) => Math.abs(a.num - targetNum) - Math.abs(b.num - targetNum));

      if (numericPool.length >= 2) {
        const near = numericPool.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, 2).map(x => x.item);
        return [currentItem, ...near].sort(() => Math.random() - 0.5);
      }
    }
  }

  // 5. General smart selection: score candidates by lexical/length similarity, pick 2 from top 6
  const candidates = basePool
    .filter(it => it.name.toLowerCase() !== target.toLowerCase())
    .map(it => ({ item: it, score: similarityScore(target, it.name) }))
    .sort((a, b) => b.score - a.score);

  const topPool = candidates.slice(0, Math.min(6, candidates.length)).map(c => c.item);
  const picked = topPool.sort(() => Math.random() - 0.5).slice(0, 2);

  return [currentItem, ...picked].sort(() => Math.random() - 0.5);
}
