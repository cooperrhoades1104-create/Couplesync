import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, couple_id FROM users WHERE id = ?').get(req.userId) as {
    id: string; email: string; name: string; couple_id: string | null;
  } | undefined;

  if (!user) {
    // User not in local DB yet — return minimal info from Clerk JWT
    return res.json({
      user: { id: req.userId, email: '', name: '', coupleId: null, coupleCode: null },
      partner: null,
    });
  }

  const coupleCode = user.couple_id
    ? (db.prepare('SELECT code FROM couples WHERE id = ?').get(user.couple_id) as { code: string } | undefined)?.code
    : null;

  // Get partner info
  let partner = null;
  if (user.couple_id) {
    const partnerRow = db.prepare(
      'SELECT id, email, name FROM users WHERE couple_id = ? AND id != ?'
    ).get(user.couple_id, user.id) as { id: string; email: string; name: string } | undefined;
    partner = partnerRow || null;
  }

  res.json({ user: { ...user, coupleCode }, partner });
});

// Get couple code for sharing
router.get('/couple-code', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple yet' });
  }

  const db = getDb();
  const couple = db.prepare('SELECT code FROM couples WHERE id = ?').get(req.coupleId) as { code: string } | undefined;

  if (!couple) {
    return res.status(404).json({ error: 'Couple not found' });
  }

  res.json({ coupleCode: couple.code });
});

// Upsert user after Clerk auth (called on first visit / profile sync)
router.post('/sync', authMiddleware, (req: AuthRequest, res: Response) => {
  const { email, name } = req.body;
  if (!req.userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.userId);

  if (!existing) {
    db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)').run(
      req.userId, email || '', name || ''
    );
  } else {
    db.prepare('UPDATE users SET email = ?, name = ? WHERE id = ?').run(
      email || '', name || '', req.userId
    );
  }

  const user = db.prepare('SELECT id, email, name, couple_id FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

export default router;