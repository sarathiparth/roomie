import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';

export async function createGroup(
  creatorId: string,
  name: string,
  description?: string,
  memberIds: string[] = [],
) {
  const group = await prisma.group.create({
    data: {
      name,
      description,
      members: {
        create: [
          { userId: creatorId, role: 'ADMIN' },
          ...memberIds.filter(id => id !== creatorId).map(userId => ({ userId, role: 'MEMBER' as const })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, profession: true } },
        },
      },
    },
  });

  return serializeGroup(group);
}

export async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, profession: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
  if (!group) throw new NotFoundError('Group');
  return serializeGroup(group);
}

export async function getUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
            take: 4,
          },
          _count: { select: { members: true, expenses: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(m => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    role: m.role,
    memberCount: m.group._count.members,
    expenseCount: m.group._count.expenses,
    previewMembers: m.group.members.map(gm => gm.user),
    joinedAt: m.joinedAt.toISOString(),
  }));
}

export async function addMember(groupId: string, adminId: string, userId: string) {
  const admin = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: adminId } },
  });
  if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('Only admins can add members');

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) throw new ValidationError('User is already a member');

  return prisma.groupMember.create({
    data: { groupId, userId, role: 'MEMBER' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function removeMember(groupId: string, adminId: string, userId: string) {
  if (adminId === userId) {
    // Leaving the group — downgrade or delete
    const otherAdmins = await prisma.groupMember.findFirst({
      where: { groupId, userId: { not: adminId }, role: 'ADMIN' },
    });
    if (!otherAdmins) {
      // Promote oldest member before leaving
      const oldest = await prisma.groupMember.findFirst({
        where: { groupId, userId: { not: adminId } },
        orderBy: { joinedAt: 'asc' },
      });
      if (oldest) {
        await prisma.groupMember.update({
          where: { id: oldest.id },
          data: { role: 'ADMIN' },
        });
      }
    }
  } else {
    const admin = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError();
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

function serializeGroup(group: {
  id: string; name: string; description: string | null; avatarUrl: string | null;
  createdAt: Date;
  members: Array<{
    id: string; userId: string; role: string; joinedAt: Date;
    user: { id: string; name: string; avatarUrl: string | null; profession: string | null };
  }>;
}) {
  return {
    ...group,
    createdAt: group.createdAt.toISOString(),
    members: group.members.map(m => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
  };
}
