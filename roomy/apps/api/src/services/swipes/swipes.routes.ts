import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as swipesService from './swipes.service.js';

export const swipesRouter = Router();

/** POST /api/swipes */
swipesRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { toId, action } = req.body;
    if (!toId || !action) throw new ValidationError('toId and action are required');
    if (!['LIKE', 'REJECT', 'SUPER'].includes(action)) {
      throw new ValidationError('action must be LIKE, REJECT, or SUPER');
    }
    if (toId === req.userId) throw new ValidationError('Cannot swipe on yourself');

    const result = await swipesService.recordSwipe(req.userId!, toId, action);
    ok(res, result);
  } catch (err) { next(err); }
});

/** GET /api/swipes/history */
swipesRouter.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const history = await swipesService.getSwipeHistory(req.userId!);
    ok(res, history);
  } catch (err) { next(err); }
});
