import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as quizService from './quiz.service.js';

export const quizRouter = Router();

/** POST /api/quiz/answers — save all 36 answers */
quizRouter.post('/answers', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      throw new ValidationError('answers object is required');
    }
    const result = await quizService.saveAnswers(req.userId!, answers);
    created(res, result);
  } catch (err) { next(err); }
});

/** GET /api/quiz/answers */
quizRouter.get('/answers', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await quizService.getAnswers(req.userId!);
    ok(res, result);
  } catch (err) { next(err); }
});

/** GET /api/quiz/progress */
quizRouter.get('/progress', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await quizService.getProgress(req.userId!);
    ok(res, result);
  } catch (err) { next(err); }
});
