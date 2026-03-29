// ─── Types ───────────────────────────────────────────────────────────────────

export type QuizAnswers = Record<string, number | string | string[]>;

export type DimensionKey =
  | 'clean' | 'sleep' | 'finance' | 'social'
  | 'conflict' | 'privacy' | 'culture' | 'lifestyle'
  | 'personality' | 'gender';

export type FlagType = 'hard' | 'red' | 'yellow';

export interface CompatibilityFlag {
  type: FlagType;
  dim: DimensionKey | string;
  label: string;
  detail: string;
  score?: number;
}

export interface CompatibilityResult {
  overall: number;
  dimScores: Record<DimensionKey, number>;
  flags: CompatibilityFlag[];
  hardBlock: boolean;
}

export interface Question {
  id: string;
  section: string;
  dimension: string;
  type: 'scenario_choice' | 'mcq_multi' | 'slider';
  text: string;
  hint?: string;
  options?: Array<{ label: string; value: number | string }>;
  min?: number;
  max?: number;
  step?: number;
  labels?: string[];
  default?: number;
  weight?: number;
}

export interface Section {
  id: string;
  label: string;
  emoji: string;
  count: number;
}

export interface ConversationPrompt {
  dim: string;
  color: FlagType;
  prompt: string;
}
