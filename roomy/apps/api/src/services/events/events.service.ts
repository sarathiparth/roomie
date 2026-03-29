import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

export async function getEvents(userId: string, filters?: { groupId?: string; upcoming?: boolean }) {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { isPublic: true },
        { attendees: { some: { userId } } },
        { creatorId: userId },
        ...(filters?.groupId ? [{ groupId: filters.groupId }] : []),
      ],
      ...(filters?.upcoming && { startsAt: { gte: now } }),
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      attendees: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      _count: { select: { attendees: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: 50,
  });

  return events.map(e => ({
    ...e,
    myStatus: e.attendees.find(a => a.userId === userId)?.status ?? null,
    attendeeCount: e._count.attendees,
    createdAt: e.createdAt.toISOString(),
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString(),
    attendees: e.attendees.map(a => ({ ...a, user: a.user })),
    _count: undefined,
  }));
}

export async function getEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      attendees: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, profession: true } } },
      },
    },
  });

  if (!event) throw new NotFoundError('Event');
  if (!event.isPublic && event.creatorId !== userId) {
    const attending = event.attendees.some(a => a.userId === userId);
    if (!attending) throw new ForbiddenError('This event is private');
  }

  return {
    ...event,
    myStatus: event.attendees.find(a => a.userId === userId)?.status ?? null,
    createdAt: event.createdAt.toISOString(),
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString(),
  };
}

export async function createEvent(
  creatorId: string,
  data: {
    title: string; description?: string; location?: string;
    startsAt: string; endsAt?: string; isPublic?: boolean; groupId?: string;
  },
) {
  // If groupId provided, verify creator is a member
  if (data.groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: creatorId } },
    });
    if (!member) throw new ForbiddenError('Not a member of this group');
  }

  const event = await prisma.event.create({
    data: {
      creatorId,
      title: data.title,
      description: data.description,
      location: data.location,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      isPublic: data.isPublic ?? false,
      groupId: data.groupId,
      // Creator auto-attends
      attendees: { create: { userId: creatorId, status: 'GOING' } },
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  return {
    ...event,
    createdAt: event.createdAt.toISOString(),
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString(),
  };
}

export async function setAttendance(
  eventId: string,
  userId: string,
  status: 'GOING' | 'MAYBE' | 'NOT_GOING',
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Event');

  return prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status },
  });
}
