import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { initDb } from './db/init';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import moodRoutes from './routes/mood';
import subscriptionRoutes from './routes/subscription';
import stripeRoutes from './routes/stripe';
import coupleRoutes from './routes/couple';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
initDb();

// Middleware
app.use(cors());

// Stripe webhook needs raw body — handle before JSON parser
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  (req as any).rawBody = req.body;
  next();
});

app.use(express.json());

// API Routes
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

// Serve static frontend build
const distPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`CoupleSync running on http://0.0.0.0:${PORT}`);
  console.log(`  API:    http://0.0.0.0:${PORT}/api/health`);
  console.log(`  Frontend: http://0.0.0.0:${PORT}/`);
});