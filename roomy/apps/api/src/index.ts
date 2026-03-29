import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { env } from './config/env.js';
import { errorHandler } from './utils/errors.js';
import { initSocket } from './socket/socket.handler.js';

// Route imports
import { authRouter } from './services/auth/auth.routes.js';
import { usersRouter } from './services/users/users.routes.js';
import { quizRouter } from './services/quiz/quiz.routes.js';
import { matchingRouter } from './services/matching/matching.routes.js';
import { swipesRouter } from './services/swipes/swipes.routes.js';
import { listingsRouter } from './services/listings/listings.routes.js';
import { chatRouter } from './services/chat/chat.routes.js';
import { groupsRouter } from './services/groups/groups.routes.js';
import { expensesRouter } from './services/expenses/expenses.routes.js';
import { eventsRouter } from './services/events/events.routes.js';

const app = express();
const httpServer = createServer(app);

// Init Socket.io
initSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(passport.initialize());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: env.NODE_ENV });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/matches', matchingRouter);
app.use('/api/swipes', swipesRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/chats', chatRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/groups/:groupId/expenses', expensesRouter); // Note: nested route handled in Router({ mergeParams: true })
app.use('/api/events', eventsRouter);

// Error Handling
app.use(errorHandler);

// Start Server
httpServer.listen(env.PORT, () => {
  console.log(`🚀 API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
