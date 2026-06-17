import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', (req: AuthRequest, res: Response) => {
  const { email, name, password, coupleCode } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name, and password are required' });
  }

  const db = getDb();

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  let coupleId: string | null = null;

  // If couple code provided, join that couple
  if (coupleCode) {
    const couple = db.prepare('SELECT id FROM couples WHERE code = ?').get(coupleCode) as { id: string } | undefined;
    if (!couple) {
      return res.status(404).json({ error: 'Invalid couple code' });
    }
    coupleId = couple.id;
  } else {
    // Create a new couple
    coupleId = uuidv4();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.prepare('INSERT INTO couples (id, code) VALUES (?, ?)').run(coupleId, code);
  }

  // Create user subscription record
  db.prepare('INSERT INTO users (id, email, name, password_hash, couple_id) VALUES (?, ?, ?, ?, ?)').run(
    userId, email, name, passwordHash, coupleId
  );

  // Create subscription record if not exists
  const existingSub = db.prepare('SELECT id FROM subscriptions WHERE couple_id = ?').get(coupleId);
  if (!existingSub) {
    db.prepare('INSERT INTO subscriptions (id, couple_id, status, tier) VALUES (?, ?, ?, ?)').run(
      uuidv4(), coupleId, 'active', 'free'
    );
  }

  const token = generateToken(userId, coupleId);

  res.status(201).json({
    token,
    user: { id: userId, email, name, coupleId },
    coupleCode: coupleCode || db.prepare('SELECT code FROM couples WHERE id = ?').get(coupleId)
  });
});

// Login
router.post('/login', (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT id, email, name, password_hash, couple_id FROM users WHERE email = ?').get(email) as {
    id: string; email: string; name: string; password_hash: string; couple_id: string | null;
  } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const coupleCode = user.couple_id
    ? (db.prepare('SELECT code FROM couples WHERE id = ?').get(user.couple_id) as { code: string } | undefined)?.code
    : null;

  const token = generateToken(user.id, user.couple_id);

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, coupleId: user.couple_id },
    coupleCode
  });
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, couple_id FROM users WHERE id = ?').get(req.userId) as {
    id: string; email: string; name: string; couple_id: string | null;
  } | undefined;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
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

export default router;