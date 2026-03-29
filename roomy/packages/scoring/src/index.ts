export { computeCompatibility } from './engine.js';
export { QUESTIONS, SECTIONS } from './questions.js';
export { DIMENSION_WEIGHTS, checkHardFilters, scoreDimension } from './dimensions.js';
export { generateTags, selfInsightNote, generateConversationPrompts } from './tags.js';
export type {
  QuizAnswers,
  CompatibilityResult,
  CompatibilityFlag,
  DimensionKey,
  FlagType,
  Question,
  Section,
  ConversationPrompt,
} from './types.js';
