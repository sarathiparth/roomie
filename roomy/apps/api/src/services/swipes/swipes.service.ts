import { prisma } from '../../db/prisma.js';
import { ConflictError } from '../../utils/errors.js';
import type { SwipeAction } from '@roomy/types';
import { getIo } from '../../socket/socket.handler.js';

export async function recordSwipe(
  fromId: string,
  toId: string,
  action: SwipeAction,
): Promise<{ matched: boolean; matchId?: string; chatId?: string }> {
  // Upsert the swipe (allow updating a previous reject to a like)
  await prisma.swipe.upsert({
    where: { fromId_toId: { fromId, toId } },
    create: { fromId, toId, action },
    update: { action },
  });

  if (action === 'REJECT') return { matched: false };

  // Check if the other user already liked us
  const theirSwipe = await prisma.swipe.findUnique({
    where: { fromId_toId: { fromId: toId, toId: fromId } },
  });

  const mutualLike = theirSwipe && (theirSwipe.action === 'LIKE' || theirSwipe.action === 'SUPER');
  if (!mutualLike) return { matched: false };

  // Check if match already exists
  const existingMatch = await prisma.match.findFirst({
    where: { OR: [{ userId: fromId, matchedId: toId }, { userId: toId, matchedId: fromId }] },
    include: { chat: { select: { id: true } } },
  });
  if (existingMatch) {
    return { matched: true, matchId: existingMatch.id, chatId: existingMatch.chat?.id };
  }

  // Get compatibility score from cache
  const [a, b] = [fromId, toId].sort();
  const cache = await prisma.compatibilityCache.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  const score = cache?.score ?? 50;

  // Create match + chat in a transaction
  const { match, chat } = await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: { userId: fromId, matchedId: toId, score },
      include: {
        matched: { select: { id: true, name: true, avatarUrl: true, profession: true } },
      },
    });
    const chat = await tx.chat.create({ data: { matchId: match.id } });

    // Also create reverse match for querying from both sides
    await tx.match.create({
      data: { userId: toId, matchedId: fromId, score },
    }).catch(() => {}); // ignore if already exists

    return { match, chat };
  });

  // Emit real-time notification to both users
  const io = getIo();
  if (io) {
    const matchPayload = { id: match.id, score, matchedUser: match.matched, chatId: chat.id };
    io.to(`user:${fromId}`).emit('match:new', matchPayload);
    io.to(`user:${toId}`).emit('match:new', { ...matchPayload, matchedUser: { id: fromId } });
  }

  return { matched: true, matchId: match.id, chatId: chat.id };
}

export async function getSwipeHistory(userId: string) {
  const swipes = await prisma.swipe.findMany({
    where: { fromId: userId },
    include: {
      to: { select: { id: true, name: true, avatarUrl: true, profession: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return swipes.map(s => ({
    id: s.id,
    action: s.action,
    user: s.to,
    createdAt: s.createdAt.toISOString(),
  }));
}
