import express from 'express';
import cors from 'cors';
import { initDb } from './db/init';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import moodRoutes from './routes/mood';
import subscriptionRoutes from './routes/subscription';
import stripeRoutes from './routes/stripe';
import coupleRoutes from './routes/couple';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
initDb();

// Middleware
app.use(cors());

// Stripe webhook needs raw body — handle before JSON parser
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Store raw body and pass to stripe route
  (req as any).rawBody = req.body;
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/couple', coupleRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, HOST, () => {
  console.log(`CoupleSync API server running on http://0.0.0.0:${PORT}`);
});