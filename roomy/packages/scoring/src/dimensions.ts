import type { QuizAnswers, CompatibilityFlag, DimensionKey } from './types.js';
import { QUESTIONS } from './questions.js';

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  clean:       0.18,
  sleep:       0.17,
  finance:     0.15,
  social:      0.13,
  conflict:    0.10,
  privacy:     0.09,
  lifestyle:   0.05,
  culture:     0.05,
  personality: 0.05,
  gender:      0.03,
};

/** Hard filter rules — returns flags if fundamentally incompatible */
export function checkHardFilters(
  userAnswers: QuizAnswers,
  profileAnswers: QuizAnswers,
): CompatibilityFlag[] {
  const flags: CompatibilityFlag[] = [];

  // Life stage mismatch
  const userStage = userAnswers['q35'];
  const profileStage = profileAnswers['q35'];
  const studentSet = new Set(['student']);
  const profSet = new Set(['earlycareer', 'midcareer', 'freelance', 'parttime']);
  if (
    (studentSet.has(String(userStage)) && profSet.has(String(profileStage))) ||
    (profSet.has(String(userStage)) && studentSet.has(String(profileStage)))
  ) {
    flags.push({
      type: 'hard', dim: 'lifestyle',
      label: 'Life Stage Mismatch',
      detail: 'Student vs Professional — structural incompatibility in schedules and budget.',
    });
  }

  // Diet incompatibility
  const dietUser = Number(userAnswers['q33']);
  const dietProfile = Number(profileAnswers['q33']);
  if ((dietUser === 1 || dietUser === 2) && dietProfile === 5) {
    flags.push({ type: 'hard', dim: 'culture', label: 'Diet Mismatch', detail: 'Strict vegetarian cannot share kitchen with full non-vegetarian.' });
  }
  if ((dietProfile === 1 || dietProfile === 2) && dietUser === 5) {
    flags.push({ type: 'hard', dim: 'culture', label: 'Diet Mismatch', detail: 'Strict vegetarian cannot share kitchen with full non-vegetarian.' });
  }

  // Guest policy clash
  const guestUser = Number(userAnswers['q25']);
  const guestProfile = Number(profileAnswers['q25']);
  if (Math.abs(guestUser - guestProfile) >= 3) {
    flags.push({ type: 'hard', dim: 'social', label: 'Guest Policy Incompatible', detail: "Opposite-sex guest policies are too different to coexist comfortably." });
  }

  return flags;
}

/** Score a single dimension */
export function scoreDimension(
  dim: DimensionKey | string,
  userAnswers: QuizAnswers,
  profileAnswers: QuizAnswers,
): number {
  const qs = QUESTIONS.filter(q => q.dimension === dim && q.type !== 'mcq_multi');
  if (qs.length === 0) return 100;

  let totalScore = 0;
  let count = 0;

  for (const q of qs) {
    const uVal = userAnswers[q.id];
    const pVal = profileAnswers[q.id];
    if (uVal === undefined || pVal === undefined) continue;

    if (q.type === 'slider') {
      const range = (q.max ?? 10) - (q.min ?? 0);
      const diff = Math.abs(Number(uVal) - Number(pVal));
      totalScore += (1 - diff / range) * 100;
    } else if (q.type === 'scenario_choice') {
      const maxVal = (q.options?.length ?? 4);
      const diff = Math.abs(Number(uVal) - Number(pVal));
      totalScore += (1 - diff / (maxVal - 1)) * 100;
    }
    count++;
  }

  return count > 0 ? totalScore / count : 100;
}

/** Score multi-select cleanliness triggers */
export function scoreMcqMulti(
  userAnswers: QuizAnswers,
  profileAnswers: QuizAnswers,
): number {
  const uSet = new Set(Array.isArray(userAnswers['q12']) ? userAnswers['q12'] : []);
  const pSet = new Set(Array.isArray(profileAnswers['q12']) ? profileAnswers['q12'] : []);

  if ((uSet.has('none') || uSet.size === 0) && (pSet.has('none') || pSet.size === 0)) return 100;

  const allTriggers = new Set([...uSet, ...pSet]);
  const conflicts = [...allTriggers].filter(t => uSet.has(t) !== pSet.has(t));
  return Math.max(0, 100 - conflicts.length * 15);
}
