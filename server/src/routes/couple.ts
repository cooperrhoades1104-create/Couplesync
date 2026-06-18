import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create a new couple (generates shareable code)
router.post('/create', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  const db = getDb();

  // Check if user is already in a couple
  const existing = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(req.userId) as { couple_id: string | null } | undefined;
  if (existing?.couple_id) {
    return res.status(400).json({ error: 'Already part of a couple' });
  }

  const coupleId = uuidv4();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  db.prepare('INSERT INTO couples (id, code) VALUES (?, ?)').run(coupleId, code);
  db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(coupleId, req.userId);

  // Create subscription record
  const existingSub = db.prepare('SELECT id FROM subscriptions WHERE couple_id = ?').get(coupleId);
  if (!existingSub) {
    db.prepare('INSERT INTO subscriptions (id, couple_id, status, tier) VALUES (?, ?, ?, ?)').run(
      uuidv4(), coupleId, 'active', 'free'
    );
  }

  res.status(201).json({ code, coupleId });
});

// Join an existing couple with a code
router.post('/join', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Couple code is required' });
  }

  const db = getDb();

  // Check if user is already in a couple
  const existing = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(req.userId) as { couple_id: string | null } | undefined;
  if (existing?.couple_id) {
    return res.status(400).json({ error: 'Already part of a couple' });
  }

  const couple = db.prepare('SELECT id FROM couples WHERE code = ?').get(code.toUpperCase()) as { id: string } | undefined;
  if (!couple) {
    return res.status(404).json({ error: 'Invalid couple code' });
  }

  db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').run(couple.id, req.userId);

  res.json({ coupleId: couple.id });
});

export default router;