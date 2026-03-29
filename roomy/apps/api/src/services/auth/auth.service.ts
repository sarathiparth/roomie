import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import type { SignupDTO, LoginDTO, AuthResponse } from '@roomy/types';

function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function sanitizeUser(user: {
  id: string; email: string; name: string; age: number;
  profession: string | null; bio: string | null; instagramId: string | null;
  avatarUrl: string | null; mode: string; smoking: boolean; drinking: boolean;
  pets: boolean; budgetMin: number | null; budgetMax: number | null; createdAt: Date;
}) {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function signup(dto: SignupDTO): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      name: dto.name,
      age: dto.age,
      profession: dto.profession,
    },
  });

  const tokens = generateTokens(user.id);
  return { user: sanitizeUser(user) as AuthResponse['user'], tokens };
}

export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const tokens = generateTokens(user.id);
  return { user: sanitizeUser(user) as AuthResponse['user'], tokens };
}

export async function refresh(token: string): Promise<{ accessToken: string }> {
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new NotFoundError('User');

  const accessToken = jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken };
}

export async function handleGoogleCallback(
  googleId: string,
  email: string,
  name: string,
  avatarUrl?: string,
): Promise<AuthResponse> {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId,
        email,
        name,
        age: 0, // prompt user to complete profile
        avatarUrl,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatarUrl: user.avatarUrl ?? avatarUrl },
    });
  }

  const tokens = generateTokens(user.id);
  return { user: sanitizeUser(user) as AuthResponse['user'], tokens };
}
