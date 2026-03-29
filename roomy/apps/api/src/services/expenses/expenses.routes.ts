import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import { upload } from '../../middleware/upload.js';
import * as expensesService from './expenses.service.js';

export const expensesRouter = Router({ mergeParams: true });

/** GET /api/groups/:groupId/expenses */
expensesRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await expensesService.getGroupExpenses(req.params.groupId, req.userId!);
    ok(res, result);
  } catch (err) { next(err); }
});

/** POST /api/groups/:groupId/expenses */
expensesRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { title, totalAmount, splits, billImageUrl, ocrData } = req.body;
    if (!title || !totalAmount || !splits?.length) {
      throw new ValidationError('title, totalAmount, and splits are required');
    }
    const expense = await expensesService.addExpense(
      req.params.groupId,
      req.userId!,
      { title, totalAmount: Number(totalAmount), splits, billImageUrl, ocrData },
    );
    created(res, expense);
  } catch (err) { next(err); }
});

/** POST /api/groups/:groupId/expenses/ocr — Upload bill image and extract items */
expensesRouter.post('/ocr', authenticate, upload.single('bill'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) throw new ValidationError('bill image is required');
    const result = await expensesService.ocrBill(
      req.params.groupId,
      req.userId!,
      req.file.buffer,
    );
    ok(res, result);
  } catch (err) { next(err); }
});

/** PATCH /api/groups/:groupId/expenses/:expenseId/splits/:splitUserId — Mark settled */
expensesRouter.patch('/:expenseId/splits/:splitUserId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await expensesService.settleSplit(
      req.params.expenseId,
      req.params.splitUserId,
      req.userId!,
      req.params.groupId,
    );
    ok(res, result);
  } catch (err) { next(err); }
});
