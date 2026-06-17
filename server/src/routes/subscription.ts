import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get subscription status
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE couple_id = ?').get(req.coupleId);

  if (!sub) {
    return res.json({ subscription: { tier: 'free', status: 'inactive' } });
  }

  res.json({ subscription: sub });
});

// Upgrade to premium (stub — will integrate Stripe later)
router.post('/upgrade', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  db.prepare('UPDATE subscriptions SET tier = ?, status = ? WHERE couple_id = ?').run(
    'premium', 'active', req.coupleId
  );

  // If no row updated, insert
  if (db.changes === 0) {
    const { v4: uuidv4 } = require('uuid');
    db.prepare('INSERT INTO subscriptions (id, couple_id, tier, status) VALUES (?, ?, ?, ?)').run(
      uuidv4(), req.coupleId, 'premium', 'active'
    );
  }

  res.json({ message: 'Upgraded to premium', tier: 'premium' });
});

// Cancel subscription
router.post('/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  db.prepare('UPDATE subscriptions SET tier = ?, status = ? WHERE couple_id = ?').run(
    'free', 'cancelled', req.coupleId
  );

  res.json({ message: 'Subscription cancelled', tier: 'free' });
});

export default router;