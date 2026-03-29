import { prisma } from '../../db/prisma.js';
import { generateTags, selfInsightNote } from '@roomy/scoring';
import type { QuizAnswers } from '@roomy/types';
import { NotFoundError } from '../../utils/errors.js';

export async function saveAnswers(userId: string, answers: QuizAnswers) {
  const tags = generateTags(answers as Record<string, number | string | string[]>);
  const insight = selfInsightNote(answers as Record<string, number | string | string[]>);

  const quiz = await prisma.quizAnswers.upsert({
    where: { userId },
    create: { userId, answers: answers as object, tags, selfInsight: insight },
    update: { answers: answers as object, tags, selfInsight: insight },
  });

  // Invalidate compatibility cache for this user so it gets recomputed
  await prisma.compatibilityCache.deleteMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
  });

  return { tags, selfInsight: insight, updatedAt: quiz.updatedAt.toISOString() };
}

export async function getAnswers(userId: string) {
  const quiz = await prisma.quizAnswers.findUnique({ where: { userId } });
  if (!quiz) throw new NotFoundError('Quiz answers');
  return {
    answers: quiz.answers,
    tags: quiz.tags,
    selfInsight: quiz.selfInsight,
    updatedAt: quiz.updatedAt.toISOString(),
  };
}

export async function getProgress(userId: string): Promise<{
  completed: boolean; answeredCount: number; totalQuestions: number;
}> {
  const quiz = await prisma.quizAnswers.findUnique({ where: { userId } });
  const TOTAL_QUESTIONS = 36;
  if (!quiz) return { completed: false, answeredCount: 0, totalQuestions: TOTAL_QUESTIONS };

  const answers = quiz.answers as Record<string, unknown>;
  const answeredCount = Object.keys(answers).length;
  return {
    completed: answeredCount >= TOTAL_QUESTIONS,
    answeredCount,
    totalQuestions: TOTAL_QUESTIONS,
  };
}
