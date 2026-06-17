import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create mood check-in
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId || !req.userId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const { mood, note } = req.body;
  if (!mood) {
    return res.status(400).json({ error: 'Mood is required' });
  }

  const db = getDb();
  const id = uuidv4();
  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const existing = db.prepare(
    'SELECT id FROM mood_checkins WHERE user_id = ? AND date = ?'
  ).get(req.userId, today) as { id: string } | undefined;

  if (existing) {
    // Update existing
    db.prepare('UPDATE mood_checkins SET mood = ?, note = ? WHERE id = ?').run(mood, note || null, existing.id);
    const updated = db.prepare('SELECT * FROM mood_checkins WHERE id = ?').get(existing.id as string);
    return res.json({ checkin: updated });
  }

  db.prepare(
    'INSERT INTO mood_checkins (id, user_id, couple_id, mood, note, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, req.coupleId, mood, note || null, today);

  const checkin = db.prepare('SELECT * FROM mood_checkins WHERE id = ?').get(id);
  res.status(201).json({ checkin });
});

// Get mood check-ins for the couple
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  const days = parseInt(req.query.days as string) || 7;

  const checkins = db.prepare(`
    SELECT mc.*, u.name as user_name, u.id as user_id
    FROM mood_checkins mc
    JOIN users u ON mc.user_id = u.id
    WHERE mc.couple_id = ?
      AND mc.date >= date('now', '-' || ? || ' days')
    ORDER BY mc.date DESC
  `).all(req.coupleId, days);

  res.json({ checkins });
});

export default router;