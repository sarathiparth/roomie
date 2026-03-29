import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

const PAGE_SIZE = 30;

export async function getUserChats(userId: string) {
  const matches = await prisma.match.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
      matched: { select: { id: true, name: true, avatarUrl: true, profession: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches
    .filter(m => m.chat)
    .map(m => ({
      id: m.chat!.id,
      matchId: m.id,
      otherUser: m.matched,
      lastMessage: m.chat!.messages[0]
        ? { content: m.chat!.messages[0].content, createdAt: m.chat!.messages[0].createdAt.toISOString() }
        : null,
      createdAt: m.chat!.createdAt.toISOString(),
    }));
}

export async function getMessages(
  chatId: string, userId: string, page = 1,
) {
  // Verify user belongs to this chat
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      match: { OR: [{ userId }, { matchedId: userId }] },
    },
  });
  if (!chat) throw new ForbiddenError('No access to this chat');

  const [total, messages] = await prisma.$transaction([
    prisma.message.count({ where: { chatId } }),
    prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    }),
  ]);

  // Mark messages as read
  await prisma.message.updateMany({
    where: { chatId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  return {
    items: messages.reverse().map(m => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      sender: m.sender,
      content: m.content,
      type: m.type,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    total, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < total,
  };
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: 'TEXT' | 'IMAGE' | 'SYSTEM' = 'TEXT',
) {
  // Verify sender belongs to chat
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      match: { OR: [{ userId: senderId }, { matchedId: senderId }] },
    },
  });
  if (!chat) throw new ForbiddenError('No access to this chat');

  const message = await prisma.message.create({
    data: { chatId, senderId, content, type },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    sender: message.sender,
    content: message.content,
    type: message.type,
    readAt: message.readAt?.toISOString(),
    createdAt: message.createdAt.toISOString(),
  };
}
