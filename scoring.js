// scoring.js — Compatibility engine

import { QUESTIONS } from './questions.js';

export const DIMENSION_WEIGHTS = {
  clean:     0.18,
  sleep:     0.17,
  finance:   0.15,
  social:    0.13,
  conflict:  0.10,
  privacy:   0.09,
  lifestyle: 0.05,
  culture:   0.05,
  personality: 0.05,
  gender:    0.03,
};

// Hard filter rules — returns null if incompatible, else continues scoring
export function checkHardFilters(userAnswers, profileAnswers) {
  const flags = [];

  // Lifestyle stage
  const userStage = userAnswers['q35'];
  const profileStage = profileAnswers['q35'];
  const studentSet = new Set(['student']);
  const profSet = new Set(['earlycareer', 'midcareer', 'freelance', 'parttime']);
  if (
    (studentSet.has(userStage) && profSet.has(profileStage)) ||
    (profSet.has(userStage) && studentSet.has(profileStage))
  ) {
    flags.push({ type: 'hard', dim: 'lifestyle', label: 'Life Stage Mismatch', detail: 'Student vs Professional — structural incompatibility in schedules and budget.' });
  }

  // Diet compatibility
  const dietUser = userAnswers['q33'];
  const dietProfile = profileAnswers['q33'];
  // Strict Jain (1) or Strict Veg (2) cannot live with full non-veg (5)
  if ((dietUser === 1 || dietUser === 2) && dietProfile === 5) {
    flags.push({ type: 'hard', dim: 'culture', label: 'Diet Mismatch', detail: 'Strict vegetarian cannot share kitchen with full non-vegetarian.' });
  }
  if ((dietProfile === 1 || dietProfile === 2) && dietUser === 5) {
    flags.push({ type: 'hard', dim: 'culture', label: 'Diet Mismatch', detail: 'Strict vegetarian cannot share kitchen with full non-vegetarian.' });
  }

  // Opposite-sex guest policy
  const guestUser = userAnswers['q25'];
  const guestProfile = profileAnswers['q25'];
  // If one strictly refuses (4) and other is fully open (1), flag it
  if (Math.abs(guestUser - guestProfile) >= 3) {
    flags.push({ type: 'hard', dim: 'social', label: 'Guest Policy Incompatible', detail: 'Opposite-sex guest policies are too different to coexist comfortably.' });
  }

  return flags;
}

// Score a single dimension for two users
function scoreDimension(dim, userAnswers, profileAnswers) {
  const qs = QUESTIONS.filter(q => q.dimension === dim && q.type !== 'mcq_multi');
  if (qs.length === 0) return 100;

  let totalScore = 0;
  let count = 0;

  for (const q of qs) {
    const uVal = userAnswers[q.id];
    const pVal = profileAnswers[q.id];
    if (uVal === undefined || pVal === undefined) continue;

    if (q.type === 'slider') {
      const range = q.max - q.min;
      const diff = Math.abs(uVal - pVal);
      const normalized = 1 - (diff / range);
      totalScore += normalized * 100;
    } else if (q.type === 'scenario_choice') {
      const maxVal = q.options.length;
      const diff = Math.abs(uVal - pVal);
      const normalized = 1 - (diff / (maxVal - 1));
      totalScore += normalized * 100;
    }
    count++;
  }

  return count > 0 ? totalScore / count : 100;
}

// Score multi-select questions (cleanliness dimension)
function scoreMcqMulti(userAnswers, profileAnswers) {
  const q = QUESTIONS.find(q => q.id === 'q12');
  if (!q) return 100;
  const uSet = new Set(userAnswers['q12'] || []);
  const pSet = new Set(profileAnswers['q12'] || []);

  // If both selected "none" or both empty, perfect match
  if ((uSet.has('none') || uSet.size === 0) && (pSet.has('none') || pSet.size === 0)) return 100;

  // Calculate overlap — if I'm bothered by dishes and they leave dishes, bad
  const allTriggers = new Set([...uSet, ...pSet]);
  const conflicts = [...allTriggers].filter(t => uSet.has(t) !== pSet.has(t));
  const score = Math.max(0, 100 - (conflicts.length * 15));
  return score;
}

// Main scoring function
export function computeCompatibility(userAnswers, profileAnswers) {
  const hardFlags = checkHardFilters(userAnswers, profileAnswers);
  const hardBlock = hardFlags.filter(f => f.type === 'hard');

  const dimScores = {};
  for (const dim of Object.keys(DIMENSION_WEIGHTS)) {
    dimScores[dim] = scoreDimension(dim, userAnswers, profileAnswers);
  }

  // Blend mcq_multi into clean dimension
  const multiScore = scoreMcqMulti(userAnswers, profileAnswers);
  dimScores['clean'] = (dimScores['clean'] * 0.7) + (multiScore * 0.3);

  // Compute budget compatibility
  const budgetUser = userAnswers['q17'] || 15000;
  const budgetProfile = profileAnswers['q17'] || 15000;
  const budgetDiff = Math.abs(budgetUser - budgetProfile) / Math.max(budgetUser, budgetProfile);
  dimScores['finance'] = (dimScores['finance'] * 0.7) + ((1 - Math.min(budgetDiff * 2, 1)) * 100 * 0.3);

  // Weighted overall
  let overall = 0;
  for (const [dim, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    overall += (dimScores[dim] || 80) * weight;
  }

  // Hard blocks reduce score significantly
  overall = Math.max(0, overall - (hardBlock.length * 20));

  // Generate soft flags
  const softFlags = [];
  for (const [dim, score] of Object.entries(dimScores)) {
    if (score < 40) {
      softFlags.push({ type: 'red', dim, score: Math.round(score), label: flagLabel(dim), detail: flagDetail(dim, score, 'red') });
    } else if (score < 65) {
      softFlags.push({ type: 'yellow', dim, score: Math.round(score), label: flagLabel(dim), detail: flagDetail(dim, score, 'yellow') });
    }
  }

  return {
    overall: Math.round(Math.min(overall, 99)),
    dimScores: Object.fromEntries(Object.entries(dimScores).map(([k, v]) => [k, Math.round(v)])),
    flags: [...hardFlags, ...softFlags].sort((a, b) => (a.type === 'hard' ? -1 : b.type === 'hard' ? 1 : a.score - b.score)),
    hardBlock: hardBlock.length > 0,
  };
}

function flagLabel(dim) {
  const labels = {
    clean: 'Cleanliness', sleep: 'Sleep Schedule', finance: 'Financial Habits',
    social: 'Social Life', conflict: 'Communication Style', privacy: 'Privacy & Space',
    culture: 'Culture & Diet', lifestyle: 'Life Stage', personality: 'Personality',
    gender: 'Gender/Safety',
  };
  return labels[dim] || dim;
}

function flagDetail(dim, score, type) {
  const details = {
    clean: {
      red: 'Very different cleanliness standards — daily friction is almost certain.',
      yellow: 'Some cleanliness differences. Have a direct conversation about kitchen and bathroom expectations.',
    },
    sleep: {
      red: 'Sleep schedules are significantly misaligned — noise conflict every day.',
      yellow: 'Some schedule overlap issues. Discuss quiet hours explicitly.',
    },
    finance: {
      red: 'Financial habits and budget are too different — risk of missed bills and resentment.',
      yellow: 'Different approaches to shared expenses. Set up Splitwise and a fixed monthly review.',
    },
    social: {
      red: 'Very different social needs — one person will feel their home is not their own.',
      yellow: 'Guest frequency and advance-notice preferences differ. Establish clear guest days.',
    },
    conflict: {
      red: 'Communication styles are opposite — problems will accumulate without resolution.',
      yellow: 'Different conflict approaches. Might need explicit "check-in" norm.',
    },
    privacy: {
      red: 'Privacy expectations clash — borrowing, room access, and space norms will collide.',
      yellow: 'Some privacy differences. Talk about personal item rules early.',
    },
    culture: {
      red: 'Cultural / dietary values are significantly incompatible.',
      yellow: 'Some cultural differences need discussion — kitchen sharing, prayer/fasting norms.',
    },
    lifestyle: {
      red: 'Life stage mismatch creates structural schedule incompatibility.',
      yellow: 'Different life stages — discuss schedule and home norms explicitly.',
    },
    personality: {
      yellow: 'Introvert/extrovert differences — establish personal space and noise norms.',
      red: 'Very different energy needs — will create chronic tension without clear rules.',
    },
  };
  return details[dim]?.[type] || 'Review this dimension carefully.';
}

// Generate pre-move-in conversation prompts based on flags
export function generateConversationPrompts(flags, userName) {
  const prompts = [];
  for (const flag of flags.slice(0, 4)) {
    const p = PROMPTS_BY_DIM[flag.dim];
    if (p) prompts.push({ dim: flag.dim, color: flag.type, prompt: p });
  }
  return prompts;
}

const PROMPTS_BY_DIM = {
  clean: 'Ask them: "What does \'clean kitchen\' mean to you — after every use, or once a day?" and "Who initiates bathroom cleaning in your experience?"',
  sleep: 'Ask them: "What\'s the latest you play music or take calls? What are your weekend mornings like?"',
  finance: 'Ask them: "Are you comfortable with Splitwise or do you prefer one person tracks and settles monthly? How do you handle shared household purchases?"',
  social: 'Ask them: "How many nights a week do you typically have friends over? What advance notice do you expect, and what do you need?"',
  conflict: 'Ask them: "If something I do bothers you, how would you prefer to bring it up? I\'d rather know how you handle these things upfront."',
  privacy: 'Ask them: "What\'s your approach to borrowing personal items or entering each other\'s rooms? Any hard boundaries?"',
  culture: 'Ask them: "How do you feel about cooking smells in the flat? Any kitchen rules I should know about upfront?"',
  lifestyle: 'Ask them: "What do your weekday mornings look like? Do you work from home? What does a typical Tuesday look like for you?"',
  personality: 'Ask them: "Are you someone who needs the flat to be quiet most of the time, or do you like noise and energy around?"',
};

// Generate lifestyle tags from answers
export function generateTags(answers) {
  const tags = [];

  // Sleep
  const wake = answers['q3'] || 7.5;
  if (wake <= 6.5) tags.push('Early bird 🌅');
  else if (wake >= 9) tags.push('Night owl 🦉');
  else tags.push('Mid-morning riser');

  // Social
  const social = answers['q20'] || 2;
  if (social >= 5) tags.push('Social butterfly 🦋');
  else if (social <= 1) tags.push('Home is sanctuary 🏡');

  // Personality
  const personality = answers['q24'] || 2;
  if (personality <= 1) tags.push('Introvert 🎧');
  else if (personality >= 5) tags.push('Extrovert 🎉');
  else tags.push('Ambivert');

  // Diet
  const diet = answers['q33'];
  if (diet === 1) tags.push('Strict Jain 🙏');
  else if (diet === 2) tags.push('Strict Veg 🥦');
  else if (diet === 3) tags.push('Veg + Eggs 🥚');
  else if (diet === 4) tags.push('Non-veg (no beef) 🍗');
  else if (diet === 5) tags.push('All non-veg 🍖');

  // Clean
  const cleanSelf = answers['q7'];
  if (cleanSelf === 1) tags.push('Super tidy ✨');
  else if (cleanSelf >= 4) tags.push('Relaxed about mess');

  // Finance
  const finStyle = answers['q15'];
  if (finStyle === 1) tags.push('Splitwise obsessed 📊');
  else if (finStyle === 5) tags.push('Flexible about money');

  return tags.slice(0, 5);
}

// Compute self-insight note
export function selfInsightNote(answers) {
  const conflict = answers['q27'];
  const clean = answers['q7'];
  const guests = answers['q20'];

  const notes = [];
  if (conflict >= 3) notes.push('Your indirect conflict style may create unresolved friction — flatmates may not realize something is bothering you until it\'s too late.');
  if (clean >= 4) notes.push('You describe yourself as relaxed about cleanliness — this is the #1 source of flatmate conflict. Be very honest about this upfront.');
  if (guests >= 5) notes.push('You love having guests frequently — make this very clear to potential flatmates before moving in.');
  if (answers['q4'] >= 26 && answers['q3'] >= 9) notes.push('Night owl with late mornings — you\'ll match best with similar schedules. Avoid early birds unless you\'re disciplined about noise after midnight.');

  return notes.length > 0 ? notes[0] : 'Your profile looks well-balanced — you\'ve answered honestly and your lifestyle preferences are clear. Good things ahead.';
}
