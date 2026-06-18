import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/bJe3cv4qfed64YfgwR0oM01';
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1TjYfQDWmNWGLgj43gADUdgg';

// Return the Stripe payment link URL for the subscription page
router.post('/create-checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  // Dev fallback: upgrade directly without Stripe
  if (process.env.NODE_ENV !== 'production' && !process.env.STRIPE_PAYMENT_LINK) {
    const db = getDb();
    db.prepare('UPDATE subscriptions SET tier = ?, status = ? WHERE couple_id = ?').run(
      'premium', 'active', req.coupleId
    );
    return res.json({
      url: null,
      message: 'Stripe not configured — upgraded directly (dev mode)',
      tier: 'premium'
    });
  }

  // Return the real Stripe payment link URL
  res.json({
    url: STRIPE_PAYMENT_LINK,
    priceId: PRICE_ID,
  });
});

// Confirm payment success — called when user returns from Stripe
router.post('/confirm', authMiddleware, (req: AuthRequest, res: Response) => {
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

  res.json({ message: 'Premium activated', tier: 'premium' });
});

export default router;