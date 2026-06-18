import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Subscription() {
  const [tier, setTier] = useState('free');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSubscription().then((data) => {
      setTier(data.subscription.tier);
      setStatus(data.subscription.status);
    }).catch(() => {});

    // Check for Stripe redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      handlePaymentSuccess();
    }
    if (params.get('cancelled') === 'true') {
      setMessage('Checkout was cancelled. No charges were made.');
      window.history.replaceState({}, '', '/subscription');
    }
  }, []);

  async function handlePaymentSuccess() {
    setMessage('Processing your payment...');
    try {
      const data = await api.confirmPayment();
      setTier('premium');
      setStatus('active');
      setMessage('Payment successful! Welcome to Premium! 💜');
      window.history.replaceState({}, '', '/subscription');
    } catch (err: any) {
      setMessage('Payment confirmed! If this persists, contact support.');
      setTier('premium');
      setStatus('active');
      window.history.replaceState({}, '', '/subscription');
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.createCheckoutSession();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.message) {
        // Dev mode fallback
        setTier('premium');
        setStatus('active');
        setMessage(data.message);
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;
    setLoading(true);
    try {
      const data = await api.cancelSubscription();
      setTier('free');
      setStatus('cancelled');
      setMessage(data.message);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-charcoal">Subscription</h1>
        <p className="text-muted mt-1">Unlock all features with Premium</p>
      </div>

      {message && (
        <div className={`p-3 rounded-card text-sm text-center font-medium ${
          message.includes('Welcome') || message.includes('successful')
            ? 'bg-green-50 text-green-700'
            : message.includes('cancelled') || message.includes('error')
            ? 'bg-rose-50 text-rose-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charcoal">Current Plan</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            tier === 'premium' ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-muted'
          }`}>
            {tier === 'premium' ? 'Premium' : 'Free'}
          </span>
        </div>
        <div className="space-y-3">
          <FeatureRow included title="Shared Calendar" free premium />
          <FeatureRow included title="Busy/Free Status" free premium />
          <FeatureRow included={tier === 'premium'} title="Mood Check-ins" premium />
          <FeatureRow included={tier === 'premium'} title="Date Night Suggestions" premium />
          <FeatureRow included={tier === 'premium'} title="Conflict Alerts" premium />
        </div>
      </div>

      {/* Upgrade Card */}
      <div className={`rounded-card border-2 p-6 ${
        tier === 'premium' ? 'border-green-200 bg-green-50' : 'border-rose-200 bg-white'
      }`}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💜</div>
          <h2 className="text-xl font-semibold text-charcoal">CoupleSync Premium</h2>
          <p className="text-3xl font-bold text-charcoal mt-2">$4.99<span className="text-lg font-normal text-muted">/month</span></p>
        </div>
        <ul className="space-y-2 text-sm text-muted mb-6">
          <li className="flex items-center gap-2">✅ Everything in Free</li>
          <li className="flex items-center gap-2">😊 Daily mood check-ins</li>
          <li className="flex items-center gap-2">💡 Date night suggestions</li>
          <li className="flex items-center gap-2">⚡ Conflict alerts</li>
          <li className="flex items-center gap-2">💬 Priority support</li>
        </ul>

        {tier === 'premium' ? (
          <button onClick={handleCancel} disabled={loading}
            className="w-full py-3 border border-red-200 text-red-600 font-medium rounded-button hover:bg-red-50 transition disabled:opacity-50 min-h-[44px]">
            {loading ? 'Processing...' : 'Cancel Subscription'}
          </button>
        ) : (
          <button onClick={handleUpgrade} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose to-gold text-white font-semibold rounded-button hover:opacity-90 transition disabled:opacity-50 min-h-[44px]">
            {loading ? 'Redirecting to Stripe...' : 'Subscribe with Stripe — $4.99/mo'}
          </button>
        )}

        <p className="text-xs text-muted text-center mt-3">
          Secure payment via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ included, title, free, premium }: { included?: boolean; title: string; free?: boolean; premium?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{included ? '✅' : '❌'}</span>
      <span className={included ? 'text-charcoal' : 'text-muted'}>{title}</span>
      <span className="ml-auto text-xs text-muted">
        {free && premium ? 'Free + Premium' : premium ? 'Premium' : ''}
      </span>
    </div>
  );
}