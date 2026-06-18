import { Router, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Initialize Stripe — use env var with fallback for dev
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-03-31.basil' as any }) : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1QzExamplePlaceholder';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Create Stripe Checkout Session
router.post('/create-checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.coupleId) {
    return res.status(400).json({ error: 'Not part of a couple' });
  }

  if (!stripe) {
    // Fallback: if no Stripe key, return a mock checkout URL
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_creation: 'always',
      metadata: { coupleId: req.coupleId },
      success_url: `${req.headers.origin || 'http://localhost:3001'}/subscription?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3001'}/subscription?cancelled=true`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create a billing portal session for managing subscription
router.post('/portal', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.coupleId || !stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const db = getDb();
  const sub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE couple_id = ?').get(req.coupleId) as { stripe_customer_id: string } | undefined;

  if (!sub?.stripe_customer_id) {
    return res.status(400).json({ error: 'No Stripe customer found' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${req.headers.origin || 'http://localhost:3001'}/subscription`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req: any, res: Response) => {
  if (!stripe) {
    return res.status(200).json({ received: true });
  }

  let event: Stripe.Event;

  try {
    const sig = req.headers['stripe-signature'] as string;
    const buf = req.body; // raw body needed for webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const coupleId = session.metadata?.coupleId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (coupleId) {
        db.prepare(
          'UPDATE subscriptions SET tier = ?, status = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE couple_id = ?'
        ).run('premium', 'active', customerId, subscriptionId, coupleId);
      }
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'active' : 'cancelled';
      const tier = status === 'active' ? 'premium' : 'free';

      const sub = db.prepare('SELECT couple_id FROM subscriptions WHERE stripe_customer_id = ?').get(customerId) as { couple_id: string } | undefined;
      if (sub) {
        db.prepare('UPDATE subscriptions SET tier = ?, status = ? WHERE couple_id = ?').run(tier, status, sub.couple_id);
      }
      break;
    }
  }

  res.json({ received: true });
});

export default router;