import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import Head from 'next/head';
import Link from 'next/link';

export default function MySubscriptions() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadData(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadData(userId) {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [subsRes, walletRes] = await Promise.all([
        fetch('/api/subscriptions/my-subscriptions', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        fetch(`/api/wallet/${userId}`),
      ]);

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(subsData);
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.tier.pricePerMonth, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to view subscriptions.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Subscriptions - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Subscriptions 💎</h1>
            <p className="text-gray-400">Manage your creator subscriptions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Active Subscriptions</div>
              <div className="text-4xl font-bold">{activeSubscriptions.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Monthly Cost</div>
              <div className="text-4xl font-bold text-blue-400">{totalMonthly} Lipz</div>
              <div className="text-xs text-gray-400 mt-1">${(totalMonthly / 100).toFixed(2)}/mo</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Lipz Balance</div>
              <div className="text-4xl font-bold text-green-400">{wallet?.lipzBalance || 0}</div>
              <Link href="/buy-lipz" className="text-xs text-blue-400 hover:underline mt-1 block">
                Top Up →
              </Link>
            </div>
          </div>

          {/* Auto-Top-Up Settings */}
          <AutoTopUpCard wallet={wallet} onUpdate={() => loadData(user.id)} />

          {/* Subscriptions List */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-20 bg-[#0f0f0f] border border-gray-800 rounded-xl">
              <div className="text-6xl mb-4">💎</div>
              <p className="text-gray-400 mb-6">No active subscriptions yet</p>
              <Link
                href="/creators"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
              >
                Explore Creators
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Active Subscriptions</h2>
              {subscriptions.map((subscription) => (
                <SubscriptionCard 
                  key={subscription.id} 
                  subscription={subscription}
                  onUpdate={() => loadData(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AutoTopUpCard({ wallet, onUpdate }) {
  const [enabled, setEnabled] = useState(wallet?.autoTopUpEnabled || false);
  const [threshold, setThreshold] = useState(wallet?.autoTopUpThreshold || 100);
  const [amount, setAmount] = useState(wallet?.autoTopUpAmount || 500);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (wallet) {
      setEnabled(wallet.autoTopUpEnabled);
      setThreshold(wallet.autoTopUpThreshold);
      setAmount(wallet.autoTopUpAmount);
    }
  }, [wallet]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/wallet/auto-topup/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          enabled,
          threshold: parseInt(threshold),
          amount: parseInt(amount),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      alert('Auto-top-up settings saved! ✅');
      setShowSettings(false);
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-yellow-400 text-lg mb-2">⚡ Auto-Top-Up</h3>
          <p className="text-sm text-gray-300">
            Automatically purchase Lipz when your subscription renews and balance is low
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          enabled 
            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
        }`}>
          {enabled ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>

      {enabled && !showSettings && (
        <div className="bg-black/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Trigger When Below</div>
              <div className="font-bold">{threshold} Lipz</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Top-Up Amount</div>
              <div className="font-bold">{amount} Lipz (${(amount / 100).toFixed(2)})</div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Trigger When Below (Lipz)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              min="1"
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:border-yellow-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Auto-Top-Up Amount (Lipz)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="100"
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:border-yellow-600 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">${(amount / 100).toFixed(2)} will be charged</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-all"
        >
          {showSettings ? 'Cancel' : 'Configure'}
        </button>
        {showSettings ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        ) : (
          <button
            onClick={() => {
              setEnabled(!enabled);
              if (!enabled) setShowSettings(true);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
              enabled 
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {enabled ? 'Disable' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({ subscription, onUpdate }) {
  const [cancelling, setCancelling] = useState(false);
  const supabase = getSupabaseClient();

  async function handleCancel() {
    if (!confirm('Cancel this subscription? You\'ll retain access until the end of your billing period.')) return;

    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to cancel');

      alert('Subscription cancelled. You\'ll retain access until the end of your current period.');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const daysLeft = Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div 
      className="bg-[#0f0f0f] border-2 rounded-xl p-6 hover:border-opacity-100 transition-all"
      style={{ borderColor: `${subscription.tier.color}40` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1" style={{ color: subscription.tier.color }}>
            {subscription.tier.name}
          </h3>
          <p className="text-gray-400 text-sm">{subscription.tier.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          subscription.status === 'ACTIVE'
            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
        }`}>
          {subscription.status}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-400 mb-1">Monthly Price</div>
          <div className="font-bold">{subscription.tier.pricePerMonth} Lipz</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Days Left</div>
          <div className="font-bold">{daysLeft} days</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Next Renewal</div>
          <div className="font-bold">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Total Paid</div>
          <div className="font-bold">{subscription.totalPaid} Lipz</div>
        </div>
      </div>

      {subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date() && (
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2 mb-4">
          <span className="text-sm font-bold text-yellow-400">
            🎁 Free Trial Until {new Date(subscription.trialEndsAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <div className="bg-red-600/20 border border-red-600/30 rounded-lg px-3 py-2 mb-4">
          <span className="text-sm font-bold text-red-400">
            ⚠️ Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/@${subscription.creatorId}`}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-center transition-all"
        >
          View Creator
        </Link>
        {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}