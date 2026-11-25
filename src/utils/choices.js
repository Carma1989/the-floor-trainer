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

const PEOPLE_CATEGORY_IDS = new Set([
  'polish_actors',
  'polish_politicians',
  'polish_music_stars',
  'pop_stars_radio',
  'foreign_rappers',
  'bridgerton',
  'casting_pool',
  'denmark',
]);

const FEMALE_FIRST_EXCEPTIONS = new Set([
  'kylie', 'miley', 'whitney', 'chappell', 'charli', 'doja', 'sza', 'cardi',
  'madame',
  'nicki', 'pink', 'cher', 'lorde', 'mø', 'iu', 'scarlett', 'margot', 'rachel',
  'megan', 'ice', 'missy', 'lauryn', 'agnes', 'katniss', 'hermiona', 'eloise',
  'daphne', 'kate', 'penelope', 'violet', 'hyacinth', 'prudence', 'królowa',
  'lady', 'siena', 'tate', 'gracie', 'ellie', 'billie', 'taylor', 'halsey',
  'beyoncé', 'beyonce', 'rihanna', 'adele', 'shakira', 'madonna', 'selena',
  'ariana', 'dua', 'olivia', 'sabrina', 'lana', 'bebe', 'ava', 'camila',
  'demi', 'katy', 'britney', 'christina', 'jennifer', 'celine', 'mariah',
  'janet', 'alicia', 'amy', 'norah', 'florence', 'alanis', 'björk', 'bjork',
  'sinead', 'annie', 'kate', 'roxette', 'sophie', 'caroline', 'charlotte',
  'alice', 'chloe', 'zoe', 'zoë', 'emily', 'emma', 'claire', 'hannah',
  'natalie', 'anne', 'mary', 'sarah', 'karen', 'linda', 'susan', 'jessica',
  'ashley', 'nicole', 'stephanie', 'heather', 'michelle', 'kim', 'khloe',
  'kourtney', 'kendall', 'gigi', 'bella', 'hailey', 'zendaya', 'florence',
  'anya', 'saorsie', 'saoirse', 'jodie', 'helen', 'meryl', 'cate', 'nicole',
  'penélope', 'salma', 'gal', 'angelina', 'charlize', 'sandra', 'julia',
  'reese', 'anne', 'emma', 'jennifer', 'kristen', 'dakota', 'lily', 'millie',
  'sadie', 'maya', 'chloë', 'margaret', 'elizabeth', 'victoria', 'diana',
  'catherine', 'greta', 'ingrid', 'astrid', 'freja', 'sofie', 'birgitte',
  'sidse', 'trine', 'ghita', 'connie', 'nina', 'lone', 'helle', 'mette',
  'pia', 'pernille', 'iben', 'paprika', 'bodil', 'kirsten', 'lisbet',
]);

const MALE_FIRST_EXCEPTIONS = new Set([
  'kuba', 'barnaba', 'bonawentura', 'joshua', 'ezra', 'luca', 'sasha',
  'mustapha', 'nikola', 'busta', 'flo', 'dababy', 'andrea', 'luka', 'mika',
  'bono', 'sting', 'drake', 'future', 'nas', 'jay-z', 'kanye', 'ye', 'eminem',
  'kendrick', 'travis', 'post', 'the', 'ed', 'shawn', 'justin', 'bruno',
  'harry', 'sam', 'charlie', 'lewis', 'elton', 'freddie', 'david', 'michael',
  'prince', 'elvis', 'john', 'paul', 'george', 'ringo', 'mick', 'keith',
  'robbie', 'pharell', 'pharrell', 'pitbull', 'usher', 'akon', 'ne-yo',
  'sean', 'chris', 'tyga', 'wiz', 'snoop', '50', 'ice', 'tupac', '2pac',
  'notorious', 'biggie', 'lil', 'asap', 'a$ap', 'playboi', 'juice', 'xxxtentacion',
  'pop', 'offset', 'quavo', 'takeoff', 'metro', '21', 'kodak', 'roddy',
  'gunna', 'young', 'meek', 'rick', 'pusha', 'kid', 'tyler', 'frank',
  'childish', 'mac', 'logic', 'nf', 'g-eazy', 'machine', 'jack', 'central',
  'stormzy', 'skepta', 'dave', 'burna', 'bad', 'j', 'daddy', 'maluma',
  'anthony', 'colin', 'benedict', 'gregory', 'simon', 'will', 'john',
  'król', 'książę', 'lord', 'sir', 'mads', 'nikolaj', 'viggo', 'lars',
  'anders', 'kim', 'ulrich', 'thure', 'pilou', 'jesper', 'ole', 'poul',
  'henrik', 'søren', 'peter', 'jens', 'kasper', 'mikkel', 'rasmus', 'jonas',
]);

/**
 * Heuristically detect gender ('F', 'M', or null) from a person's display name.
 * Handles Polish -a female names and common international/stage-name exceptions.
 */
export function detectPersonGender(name) {
  if (!name || typeof name !== 'string') return null;
  const cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
  const firstWord = cleaned.split(/[\s,]+/)[0]?.toLowerCase() || '';
  if (!firstWord) return null;
  if (FEMALE_FIRST_EXCEPTIONS.has(firstWord)) return 'F';
  if (MALE_FIRST_EXCEPTIONS.has(firstWord)) return 'M';
  // Polish/Slavic & Latin feminine -a ending (after checking male -a exceptions)
  if (firstWord.endsWith('a') && firstWord.length > 2) return 'F';
  return 'M';
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
  const withoutTarget = basePool.filter(
    it => it.name.toLowerCase() !== target.toLowerCase()
  );

  let candidatePool = withoutTarget;
  if (PEOPLE_CATEGORY_IDS.has(catId)) {
    const targetGender = detectPersonGender(target);
    if (targetGender) {
      const sameGender = withoutTarget.filter(
        it => detectPersonGender(it.name) === targetGender
      );
      if (sameGender.length >= 2) {
        candidatePool = sameGender;
      }
    }
  }

  const candidates = candidatePool
    .map(it => ({ item: it, score: similarityScore(target, it.name) }))
    .sort((a, b) => b.score - a.score);

  const topPool = candidates.slice(0, Math.min(6, candidates.length)).map(c => c.item);
  const picked = topPool.sort(() => Math.random() - 0.5).slice(0, 2);

  return [currentItem, ...picked].sort(() => Math.random() - 0.5);
}
