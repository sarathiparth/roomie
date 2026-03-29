import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { uploadToCloudinary } from '../../middleware/upload.js';
import { extractBillItems } from './ocr.service.js';
import { getIo } from '../../socket/socket.handler.js';

export async function getGroupExpenses(groupId: string, userId: string) {
  // Verify membership
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new ForbiddenError('Not a member of this group');

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, name: true, avatarUrl: true } },
      splits: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute balances
  const balances = computeBalances(expenses, userId);

  return {
    expenses: expenses.map(serializeExpense),
    balances,
  };
}

export async function addExpense(
  groupId: string,
  payerId: string,
  data: {
    title: string;
    totalAmount: number;
    splits: Array<{ userId: string; amount: number }>;
    billImageUrl?: string;
    ocrData?: object;
  },
) {
  // Validate splits sum to totalAmount
  const splitsTotal = data.splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitsTotal - data.totalAmount) > 0.01) {
    throw new ValidationError(`Splits total (${splitsTotal}) must equal totalAmount (${data.totalAmount})`);
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: payerId } },
  });
  if (!member) throw new ForbiddenError('Not a member of this group');

  const expense = await prisma.expense.create({
    data: {
      groupId,
      paidById: payerId,
      title: data.title,
      totalAmount: data.totalAmount,
      billImageUrl: data.billImageUrl,
      ocrData: data.ocrData,
      splits: {
        create: data.splits.map(s => ({ userId: s.userId, amount: s.amount })),
      },
    },
    include: {
      paidBy: { select: { id: true, name: true, avatarUrl: true } },
      splits: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  // Notify group via socket
  const io = getIo();
  if (io) {
    io.to(`group:${groupId}`).emit('expense:updated', { groupId });
  }

  return serializeExpense(expense);
}

export async function ocrBill(
  groupId: string,
  userId: string,
  imageBuffer: Buffer,
): Promise<{ billImageUrl: string; items: Array<{ name: string; price: number }>; rawText: string; total?: number }> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new ForbiddenError('Not a member of this group');

  // Upload to Cloudinary
  const billImageUrl = await uploadToCloudinary(imageBuffer, 'bills', {
    public_id: `bill_${userId}_${Date.now()}`,
  });

  // Run OCR
  const base64 = imageBuffer.toString('base64');
  const ocrResult = await extractBillItems(base64);

  return { billImageUrl, ...ocrResult };
}

export async function settleSplit(
  expenseId: string,
  splitUserId: string,
  requesterId: string,
  groupId: string,
) {
  // Only the member themselves or a group admin can mark as settled
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });
  if (!member) throw new ForbiddenError();
  if (splitUserId !== requesterId && member.role !== 'ADMIN') throw new ForbiddenError();

  return prisma.expenseSplit.update({
    where: { expenseId_userId: { expenseId, userId: splitUserId } },
    data: { settled: true },
  });
}

/** Compute net balances for each group member relative to the current user */
function computeBalances(
  expenses: Array<{
    paidById: string;
    splits: Array<{ userId: string; amount: number; settled: boolean }>;
  }>,
  userId: string,
): Array<{ userId: string; balance: number }> {
  const balanceMap: Record<string, number> = {};

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.settled) continue;

      if (expense.paidById === userId && split.userId !== userId) {
        // Others owe me
        balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) + split.amount;
      } else if (split.userId === userId && expense.paidById !== userId) {
        // I owe others
        balanceMap[expense.paidById] = (balanceMap[expense.paidById] ?? 0) - split.amount;
      }
    }
  }

  return Object.entries(balanceMap)
    .filter(([, bal]) => Math.abs(bal) > 0.01)
    .map(([uid, balance]) => ({ userId: uid, balance: Math.round(balance * 100) / 100 }));
}

function serializeExpense(expense: {
  id: string; groupId: string; title: string; totalAmount: number;
  paidById: string; billImageUrl: string | null; ocrData: unknown; createdAt: Date;
  paidBy: { id: string; name: string; avatarUrl: string | null };
  splits: Array<{
    id: string; expenseId: string; userId: string; amount: number; settled: boolean;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
}) {
  return { ...expense, createdAt: expense.createdAt.toISOString() };
}
