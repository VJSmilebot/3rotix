import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function WithdrawEarnings() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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
      
      const [walletRes, withdrawalsRes] = await Promise.all([
        fetch(`/api/wallet/${userId}`),
        fetch('/api/withdraw/my-withdrawals', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        setWithdrawals(withdrawalsData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  const availableBalance = wallet?.earningsCents || 0;
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === 'PENDING' || w.status === 'PROCESSING')
    .reduce((sum, w) => sum + w.amountCents, 0);
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.amountCents, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to manage withdrawals.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Withdraw Earnings - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Withdraw Earnings 💰</h1>
            <p className="text-gray-400">Cash out your creator earnings</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Available to Withdraw</div>
              <div className="text-4xl font-bold text-green-400 mb-1">
                ${(availableBalance / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {Math.floor(availableBalance / 100)} Lipz earned
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Pending Withdrawals</div>
              <div className="text-4xl font-bold text-yellow-400">
                ${(pendingWithdrawals / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {withdrawals.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING').length} requests
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Total Withdrawn</div>
              <div className="text-4xl font-bold text-blue-400">
                ${(totalWithdrawn / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {withdrawals.filter(w => w.status === 'COMPLETED').length} payouts
              </div>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableBalance < 1000}
              className="w-full md:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💸 Withdraw Funds
            </button>
            {availableBalance < 1000 && (
              <p className="text-sm text-gray-500 mt-2">
                Minimum withdrawal is $10.00. You need ${((1000 - availableBalance) / 100).toFixed(2)} more.
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-400 mb-3">💡 Withdrawal Info</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Minimum withdrawal: $10.00</li>
              <li>• Processing time: 3-5 business days</li>
              <li>• Payment methods: Bank transfer, PayPal, Cryptocurrency</li>
              <li>• No withdrawal fees (we cover them!)</li>
              <li>• You keep 90% of all sales</li>
            </ul>
          </div>

          {/* Withdrawal History */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Withdrawal History</h2>
            
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading withdrawals...</div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12 bg-[#0f0f0f] border border-gray-800 rounded-xl">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-gray-400">No withdrawal history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <WithdrawalCard 
                    key={withdrawal.id} 
                    withdrawal={withdrawal}
                    onCancel={() => loadData(user.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          wallet={wallet}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            loadData(user.id);
          }}
        />
      )}
    </>
  );
}

function WithdrawalCard({ withdrawal, onCancel }) {
  const supabase = getSupabaseClient();
  const [cancelling, setCancelling] = useState(false);

  const statusColors = {
    PENDING: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    PROCESSING: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    COMPLETED: 'bg-green-600/20 text-green-400 border-green-600/30',
    FAILED: 'bg-red-600/20 text-red-400 border-red-600/30',
    CANCELLED: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  async function handleCancel() {
    if (!confirm('Cancel this withdrawal? Funds will be returned to your earnings.')) return;

    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/withdraw/${withdrawal.id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to cancel');

      alert('Withdrawal cancelled. Funds returned to your balance.');
      onCancel();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl font-bold">${(withdrawal.amountCents / 100).toFixed(2)}</div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[withdrawal.status]}`}>
              {withdrawal.status}
            </div>
          </div>
          
          <div className="text-sm text-gray-400 space-y-1">
            <div>Method: {withdrawal.paymentMethod}</div>
            <div>Requested: {new Date(withdrawal.createdAt).toLocaleString()}</div>
            {withdrawal.processedAt && (
              <div>Processed: {new Date(withdrawal.processedAt).toLocaleString()}</div>
            )}
            {withdrawal.failureReason && (
              <div className="text-red-400">Reason: {withdrawal.failureReason}</div>
            )}
          </div>
        </div>

        {withdrawal.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}

function WithdrawModal({ wallet, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [accountDetails, setAccountDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  const availableCents = wallet?.earningsCents || 0;
  const availableDollars = (availableCents / 100).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();

    const amountCents = Math.floor(parseFloat(amount) * 100);

    if (amountCents < 1000) {
      alert('Minimum withdrawal is $10.00');
      return;
    }

    if (amountCents > availableCents) {
      alert('Insufficient balance');
      return;
    }

    if (!accountDetails.accountNumber && !accountDetails.email && !accountDetails.walletAddress) {
      alert('Please provide account details');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amountCents,
          paymentMethod,
          paymentDetails: accountDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request withdrawal');
      }

      alert('Withdrawal requested! Processing in 3-5 business days. 💰');
      onSuccess();
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-gray-800 rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Withdraw Funds</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Available Balance */}
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-green-400">${availableDollars}</div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Withdrawal Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                max={availableDollars}
                step="0.01"
                placeholder="10.00"
                required
                className="w-full pl-8 pr-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum: $10.00 • Maximum: ${availableDollars}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setAccountDetails({});
              }}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="PAYPAL">PayPal</option>
              <option value="CRYPTO">Cryptocurrency</option>
            </select>
          </div>

          {/* Account Details */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Account Holder Name"
                value={accountDetails.accountName || ''}
                onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accountDetails.accountNumber || ''}
                onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              />
              <input
                type="text"
                placeholder="Routing Number"
                value={accountDetails.routingNumber || ''}
                onChange={(e) => setAccountDetails({...accountDetails, routingNumber: e.target.value})}
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              />
            </div>
          )}

          {paymentMethod === 'PAYPAL' && (
            <input
              type="email"
              placeholder="PayPal Email"
              value={accountDetails.email || ''}
              onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
              required
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
            />
          )}

          {paymentMethod === 'CRYPTO' && (
            <div className="space-y-3">
              <select
                value={accountDetails.currency || 'BTC'}
                onChange={(e) => setAccountDetails({...accountDetails, currency: e.target.value})}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDT">Tether (USDT)</option>
              </select>
              <input
                type="text"
                placeholder="Wallet Address"
                value={accountDetails.walletAddress || ''}
                onChange={(e) => setAccountDetails({...accountDetails, walletAddress: e.target.value})}
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-green-600 outline-none"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Withdrawals are processed within 3-5 business days. No fees!
          </p>
        </form>
      </div>
    </div>
  );
}