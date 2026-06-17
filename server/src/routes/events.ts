import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all events for the couple
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  const events = db.prepare(
    'SELECT e.*, u.name as user_name FROM events e JOIN users u ON e.user_id = u.id WHERE e.couple_id = ? ORDER BY e.start_time'
  ).all(req.coupleId);

  res.json({ events });
});

// Create an event
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId || !req.userId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const { title, description, startTime, endTime, isBusy } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, startTime, and endTime are required' });
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(
    'INSERT INTO events (id, couple_id, user_id, title, description, start_time, end_time, is_busy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.coupleId, req.userId, title, description || null, startTime, endTime, isBusy ? 1 : 0);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);

  res.status(201).json({ event });
});

// Update an event
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM events WHERE id = ? AND couple_id = ?').get(req.params.id, req.coupleId) as any;

  if (!existing) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { title, description, startTime, endTime, isBusy } = req.body;

  db.prepare(
    'UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, is_busy = ? WHERE id = ?'
  ).run(
    title || existing.title,
    description !== undefined ? description : existing.description,
    startTime || existing.start_time,
    endTime || existing.end_time,
    isBusy !== undefined ? (isBusy ? 1 : 0) : existing.is_busy,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id as string);
  res.json({ event: updated });
});

// Delete an event
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM events WHERE id = ? AND couple_id = ?').get(req.params.id, req.coupleId);

  if (!existing) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id as string);
  res.json({ message: 'Event deleted' });
});

// Get conflict alerts (overlapping events for the couple)
router.get('/conflicts', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  const db = getDb();
  // Find overlapping events between partners
  const conflicts = db.prepare(`
    SELECT e1.id as event1_id, e1.title as event1_title, e1.start_time as event1_start, e1.end_time as event1_end,
           u1.name as event1_user,
           e2.id as event2_id, e2.title as event2_title, e2.start_time as event2_start, e2.end_time as event2_end,
           u2.name as event2_user
    FROM events e1
    JOIN events e2 ON e1.couple_id = e2.couple_id AND e1.user_id < e2.user_id
    JOIN users u1 ON e1.user_id = u1.id
    JOIN users u2 ON e2.user_id = u2.id
    WHERE e1.couple_id = ?
      AND e1.start_time < e2.end_time
      AND e1.end_time > e2.start_time
    ORDER BY e1.start_time
  `).all(req.coupleId);

  res.json({ conflicts });
});

export default router;