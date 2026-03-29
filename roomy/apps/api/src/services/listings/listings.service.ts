import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { uploadToCloudinary } from '../../middleware/upload.js';

const LISTING_SELECT = {
  id: true, ownerId: true, title: true, description: true, rent: true,
  deposit: true, location: true, area: true, city: true, photos: true,
  roomDetails: true, currentTenants: true, availableFrom: true, isActive: true, createdAt: true,
  owner: { select: { id: true, name: true, avatarUrl: true, profession: true } },
};

export async function getListings(filters?: {
  city?: string; maxRent?: number; page?: number; pageSize?: number;
}) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const where = {
    isActive: true,
    ...(filters?.city && { city: { contains: filters.city, mode: 'insensitive' as const } }),
    ...(filters?.maxRent && { rent: { lte: filters.maxRent } }),
  };

  const [total, items] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      select: LISTING_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items.map(serializeListing),
    total, page, pageSize, hasMore: page * pageSize < total,
  };
}

export async function createListing(
  ownerId: string,
  data: {
    title: string; description: string; rent: number; deposit?: number;
    location: string; area: string; city: string; roomDetails: object;
    currentTenants: object[]; availableFrom: string;
  },
  photoBuffers: Buffer[],
) {
  const photoUrls = await Promise.all(
    photoBuffers.map((buf, i) =>
      uploadToCloudinary(buf, 'listings', { public_id: `${ownerId}_${Date.now()}_${i}` })
    ),
  );

  const listing = await prisma.listing.create({
    data: {
      ownerId,
      photos: photoUrls,
      availableFrom: new Date(data.availableFrom),
      title: data.title,
      description: data.description,
      rent: data.rent,
      deposit: data.deposit,
      location: data.location,
      area: data.area,
      city: data.city,
      roomDetails: data.roomDetails,
      currentTenants: data.currentTenants,
    },
    select: LISTING_SELECT,
  });

  return serializeListing(listing);
}

export async function updateListing(
  listingId: string,
  ownerId: string,
  data: Partial<{
    title: string; description: string; rent: number; deposit: number;
    location: string; area: string; roomDetails: object;
    currentTenants: object[]; availableFrom: string; isActive: boolean;
  }>,
) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.ownerId !== ownerId) throw new ForbiddenError();

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...data,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
    },
    select: LISTING_SELECT,
  });
  return serializeListing(updated);
}

export async function applyToListing(
  listingId: string, applicantId: string, message?: string,
) {
  const existing = await prisma.application.findUnique({
    where: { listingId_applicantId: { listingId, applicantId } },
  });
  if (existing) throw new Error('Already applied to this listing');

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.ownerId === applicantId) throw new ForbiddenError('Cannot apply to your own listing');

  return prisma.application.create({
    data: { listingId, applicantId, message },
    include: { applicant: { select: { id: true, name: true, avatarUrl: true, profession: true } } },
  });
}

export async function getApplicants(listingId: string, ownerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.ownerId !== ownerId) throw new ForbiddenError();

  return prisma.application.findMany({
    where: { listingId },
    include: {
      applicant: {
        select: { id: true, name: true, avatarUrl: true, profession: true, age: true, city: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateApplicationStatus(
  listingId: string, appId: string, ownerId: string, status: 'ACCEPTED' | 'REJECTED',
) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (listing.ownerId !== ownerId) throw new ForbiddenError();

  return prisma.application.update({
    where: { id: appId },
    data: { status },
  });
}

function serializeListing(listing: typeof LISTING_SELECT extends Record<string, unknown> ? unknown : unknown) {
  const l = listing as { createdAt: Date; availableFrom: Date } & Record<string, unknown>;
  return { ...l, createdAt: l.createdAt.toISOString(), availableFrom: l.availableFrom.toISOString() };
}
