import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { uploadToCloudinary } from '../../middleware/upload.js';

const USER_SELECT = {
  id: true, email: true, name: true, age: true, profession: true,
  bio: true, instagramId: true, avatarUrl: true, mode: true,
  smoking: true, drinking: true, pets: true, budgetMin: true,
  budgetMax: true, city: true, area: true, createdAt: true,
  quizAnswers: { select: { tags: true, selfInsight: true } },
};

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new NotFoundError('User');
  return {
    ...user,
    quizCompleted: !!user.quizAnswers,
    tags: user.quizAnswers?.tags ?? [],
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getPublicProfile(userId: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_SELECT, email: false },
  });
  if (!user) throw new NotFoundError('User');

  // If viewer has quiz answers and so does the profile, compute compat
  let compatibilityScore: number | undefined;
  if (viewerId && viewerId !== userId) {
    const cache = await prisma.compatibilityCache.findUnique({
      where: {
        userAId_userBId: { userAId: viewerId, userBId: userId },
      },
    });
    compatibilityScore = cache?.score;
  }

  return {
    ...user,
    quizCompleted: !!user.quizAnswers,
    tags: user.quizAnswers?.tags ?? [],
    createdAt: user.createdAt.toISOString(),
    compatibilityScore,
  };
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string; age?: number; profession?: string; bio?: string;
    instagramId?: string; mode?: string; smoking?: boolean; drinking?: boolean;
    pets?: boolean; budgetMin?: number; budgetMax?: number; city?: string; area?: string;
  },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  });
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function uploadAvatar(userId: string, buffer: Buffer): Promise<string> {
  const url = await uploadToCloudinary(buffer, 'avatars', {
    public_id: `avatar_${userId}`,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
  return url;
}

export async function deleteAccount(userId: string, requesterId: string): Promise<void> {
  if (userId !== requesterId) throw new ForbiddenError();
  await prisma.user.delete({ where: { id: userId } });
}
