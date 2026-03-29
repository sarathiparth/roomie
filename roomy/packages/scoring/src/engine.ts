import type { QuizAnswers, CompatibilityResult, DimensionKey } from './types.js';
import { DIMENSION_WEIGHTS, checkHardFilters, scoreDimension, scoreMcqMulti } from './dimensions.js';

/** Main exported compatibility function */
export function computeCompatibility(
  userAnswers: QuizAnswers,
  profileAnswers: QuizAnswers,
): CompatibilityResult {
  const hardFlags = checkHardFilters(userAnswers, profileAnswers);
  const hardBlock = hardFlags.filter(f => f.type === 'hard');

  // Score all dimensions
  const dimScores = {} as Record<DimensionKey, number>;
  for (const dim of Object.keys(DIMENSION_WEIGHTS) as DimensionKey[]) {
    dimScores[dim] = scoreDimension(dim, userAnswers, profileAnswers);
  }

  // Blend multi-select into cleanliness
  const multiScore = scoreMcqMulti(userAnswers, profileAnswers);
  dimScores['clean'] = dimScores['clean'] * 0.7 + multiScore * 0.3;

  // Blend budget compatibility
  const budgetUser = Number(userAnswers['q17'] ?? 15000);
  const budgetProfile = Number(profileAnswers['q17'] ?? 15000);
  const budgetDiff = Math.abs(budgetUser - budgetProfile) / Math.max(budgetUser, budgetProfile);
  dimScores['finance'] = dimScores['finance'] * 0.7 + (1 - Math.min(budgetDiff * 2, 1)) * 100 * 0.3;

  // Weighted overall
  let overall = 0;
  for (const [dim, weight] of Object.entries(DIMENSION_WEIGHTS) as [DimensionKey, number][]) {
    overall += (dimScores[dim] ?? 80) * weight;
  }

  // Hard blocks penalize score
  overall = Math.max(0, overall - hardBlock.length * 20);

  // Soft flags
  const softFlags = Object.entries(dimScores).flatMap(([dim, score]) => {
    if (score < 40) {
      return [{
        type: 'red' as const, dim: dim as DimensionKey, score: Math.round(score),
        label: flagLabel(dim), detail: flagDetail(dim, 'red'),
      }];
    } else if (score < 65) {
      return [{
        type: 'yellow' as const, dim: dim as DimensionKey, score: Math.round(score),
        label: flagLabel(dim), detail: flagDetail(dim, 'yellow'),
      }];
    }
    return [];
  });

  return {
    overall: Math.round(Math.min(overall, 99)),
    dimScores: Object.fromEntries(
      Object.entries(dimScores).map(([k, v]) => [k, Math.round(v)])
    ) as Record<DimensionKey, number>,
    flags: [...hardFlags, ...softFlags].sort((a, b) =>
      a.type === 'hard' ? -1 : b.type === 'hard' ? 1 : (a.score ?? 50) - (b.score ?? 50)
    ),
    hardBlock: hardBlock.length > 0,
  };
}

function flagLabel(dim: string): string {
  const labels: Record<string, string> = {
    clean: 'Cleanliness', sleep: 'Sleep Schedule', finance: 'Financial Habits',
    social: 'Social Life', conflict: 'Communication Style', privacy: 'Privacy & Space',
    culture: 'Culture & Diet', lifestyle: 'Life Stage', personality: 'Personality',
    gender: 'Gender/Safety',
  };
  return labels[dim] ?? dim;
}

function flagDetail(dim: string, type: 'red' | 'yellow'): string {
  const details: Record<string, Record<string, string>> = {
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
      yellow: 'Different approaches to shared expenses. Set up a shared tracking system.',
    },
    social: {
      red: "Very different social needs — one person will feel their home is not their own.",
      yellow: "Guest frequency and advance-notice preferences differ. Establish clear guest days.",
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
  return details[dim]?.[type] ?? 'Review this dimension carefully.';
}
