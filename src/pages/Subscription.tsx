import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function Subscription() {
  const { user } = useAuth();
  const [tier, setTier] = useState('free');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSubscription().then((data) => {
      setTier(data.subscription.tier);
      setStatus(data.subscription.status);
    }).catch(() => {});
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.upgradeSubscription();
      setTier('premium');
      setStatus('active');
      setMessage(data.message);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;
    setLoading(true);
    setMessage('');
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
        <h1 className="text-2xl font-bold text-gray-800">Subscription</h1>
        <p className="text-gray-500 mt-1">Unlock all features with Premium</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Current Plan</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            tier === 'premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
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
      <div className={`rounded-xl border-2 p-6 ${
        tier === 'premium' ? 'border-green-200 bg-green-50' : 'border-pink-200 bg-white'
      }`}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💜</div>
          <h2 className="text-xl font-bold text-gray-800">CoupleSync Premium</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">$4.99<span className="text-lg font-normal text-gray-500">/month</span></p>
        </div>

        <ul className="space-y-2 text-sm text-gray-600 mb-6">
          <li className="flex items-center gap-2">✅ Everything in Free</li>
          <li className="flex items-center gap-2">😊 Daily mood check-ins</li>
          <li className="flex items-center gap-2">💡 Date night suggestions</li>
          <li className="flex items-center gap-2">⚡ Conflict alerts</li>
          <li className="flex items-center gap-2">💬 Priority support</li>
        </ul>

        {tier === 'premium' ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full py-3 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Cancel Subscription'}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureRow({ included, title, free, premium }: { included?: boolean; title: string; free?: boolean; premium?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{included ? '✅' : '❌'}</span>
      <span className={included ? 'text-gray-800' : 'text-gray-400'}>{title}</span>
      <span className="ml-auto text-xs text-gray-400">
        {free && premium ? 'Free + Premium' : premium ? 'Premium' : ''}
      </span>
    </div>
  );
}