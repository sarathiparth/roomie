import { prisma } from '../../db/prisma.js';
import { computeCompatibility } from '@roomy/scoring';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { QuizAnswers } from '@roomy/types';

const PAGE_SIZE = 20;

export async function discoverProfiles(
  userId: string,
  page = 1,
  filters?: { mode?: string; city?: string; maxRent?: number },
) {
  // Get current user's quiz answers
  const myQuiz = await prisma.quizAnswers.findUnique({ where: { userId } });
  if (!myQuiz) throw new ValidationError('Complete the quiz before discovering matches');

  const myAnswers = myQuiz.answers as QuizAnswers;

  // Get IDs already swiped on
  const alreadySwiped = await prisma.swipe.findMany({
    where: { fromId: userId },
    select: { toId: true },
  });
  const swipedIds = alreadySwiped.map(s => s.toId);

  // Fetch candidate pool — exclude self + swiped users
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...swipedIds] },
      ...(filters?.city && { city: { contains: filters.city, mode: 'insensitive' } }),
      quizAnswers: { isNot: null }, // only users who completed the quiz
    },
    select: {
      id: true, name: true, age: true, profession: true, bio: true,
      avatarUrl: true, mode: true, city: true, area: true,
      smoking: true, drinking: true, pets: true,
      quizAnswers: { select: { answers: true, tags: true } },
    },
    take: 200, // fetch large pool to sort by score
  });

  // Score all candidates — check cache first
  const scored = await Promise.all(candidates.map(async (candidate) => {
    if (!candidate.quizAnswers) return null;

    // Try compatibility cache
    const [a, b] = [userId, candidate.id].sort();
    const cached = await prisma.compatibilityCache.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });

    let score: number;
    let dimScores: object;
    let flags: object;
    let hardBlock: boolean;

    if (cached) {
      score = cached.score;
      dimScores = cached.dimScores as object;
      flags = cached.flags as object;
      hardBlock = cached.hardBlock;
    } else {
      const result = computeCompatibility(
        myAnswers as Record<string, number | string | string[]>,
        candidate.quizAnswers.answers as Record<string, number | string | string[]>,
      );
      score = result.overall;
      dimScores = result.dimScores;
      flags = result.flags;
      hardBlock = result.hardBlock;

      // Cache the result (fire-and-forget)
      prisma.compatibilityCache.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b, score, dimScores, flags, hardBlock },
        update: { score, dimScores, flags, hardBlock },
      }).catch(() => {});
    }

    return {
      ...candidate,
      quizAnswers: undefined,
      tags: candidate.quizAnswers?.tags ?? [],
      compatibilityScore: score,
      dimScores,
      flags,
      hardBlock,
    };
  }));

  const valid = scored
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  const total = valid.length;
  const start = (page - 1) * PAGE_SIZE;
  const items = valid.slice(start, start + PAGE_SIZE);

  return { items, total, page, pageSize: PAGE_SIZE, hasMore: start + PAGE_SIZE < total };
}

export async function getMatchDetails(matchId: string, userId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ userId }, { matchedId: userId }] },
    include: {
      user: { select: { id: true, name: true, age: true, profession: true, avatarUrl: true, bio: true, city: true, area: true } },
      matched: { select: { id: true, name: true, age: true, profession: true, avatarUrl: true, bio: true, city: true, area: true } },
      chat: { select: { id: true } },
    },
  });
  if (!match) throw new NotFoundError('Match');

  const otherUser = match.userId === userId ? match.matched : match.user;
  const otherId = match.userId === userId ? match.matchedId : match.userId;

  // Get cached compatibility breakdown
  const [a, b] = [userId, otherId].sort();
  const cache = await prisma.compatibilityCache.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });

  return {
    id: match.id,
    score: match.score,
    matchedUser: otherUser,
    chatId: match.chat?.id,
    dimScores: cache?.dimScores,
    flags: cache?.flags,
    hardBlock: cache?.hardBlock,
    createdAt: match.createdAt.toISOString(),
  };
}

export async function getUserMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: { userId },
    include: {
      matched: { select: { id: true, name: true, age: true, profession: true, avatarUrl: true, city: true } },
      chat: { select: { id: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches.map(m => ({
    id: m.id,
    score: m.score,
    matchedUser: m.matched,
    chatId: m.chat?.id,
    lastMessage: m.chat?.messages[0] ? {
      content: m.chat.messages[0].content,
      createdAt: m.chat.messages[0].createdAt.toISOString(),
    } : null,
    createdAt: m.createdAt.toISOString(),
  }));
}
