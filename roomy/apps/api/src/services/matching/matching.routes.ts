import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, paginated } from '../../utils/response.js';
import * as matchingService from './matching.service.js';

export const matchingRouter = Router();

/** GET /api/matches/discover */
matchingRouter.get('/discover', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const filters = {
      city: req.query.city as string | undefined,
      maxRent: req.query.maxRent ? Number(req.query.maxRent) : undefined,
    };
    const result = await matchingService.discoverProfiles(req.userId!, page, filters);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

/** GET /api/matches — all confirmed matches for current user */
matchingRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const matches = await matchingService.getUserMatches(req.userId!);
    ok(res, matches);
  } catch (err) { next(err); }
});

/** GET /api/matches/:id */
matchingRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const match = await matchingService.getMatchDetails(req.params.id, req.userId!);
    ok(res, match);
  } catch (err) { next(err); }
});
