import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { ok, created } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

// ─── Configure Passport Google Strategy ──────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile: Profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'));
      const avatarUrl = profile.photos?.[0]?.value;
      const result = await authService.handleGoogleCallback(
        profile.id, email, profile.displayName, avatarUrl,
      );
      done(null, result);
    } catch (err) {
      done(err as Error);
    }
  },
));

// ─── Routes ──────────────────────────────────────────────────────────────────

/** POST /api/auth/signup */
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, age, profession } = req.body;
    if (!email || !password || !name || !age) {
      throw new ValidationError('email, password, name, age are required');
    }
    const result = await authService.signup({ email, password, name, age: Number(age), profession });
    created(res, result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/login */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ValidationError('email and password are required');
    const result = await authService.login({ email, password });
    ok(res, result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/refresh */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ValidationError('refreshToken is required');
    const result = await authService.refresh(refreshToken);
    ok(res, result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/logout (client-side token deletion + placeholder) */
authRouter.post('/logout', authenticate, (_req, res) => {
  ok(res, { message: 'Logged out' });
});

/** GET /api/auth/google */
authRouter.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

/** GET /api/auth/google/callback */
authRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    // req.user is the AuthResponse from the Google strategy
    const result = req.user as { tokens: { accessToken: string; refreshToken: string } };
    const frontendUrl = env.CORS_ORIGIN;
    // Redirect to frontend with tokens as query params (or use a code exchange)
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`
    );
  },
);
