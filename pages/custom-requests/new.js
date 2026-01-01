import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../../utils/supabase/client';

export default function NewCustomRequest() {
  const router = useRouter();
  const { creatorId } = router.query;
  
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(100);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadWallet(session.user.id);
      }
    }
    init();
  }, []);

  async function loadWallet(userId) {
    try {
      const res = await fetch(`/api/wallet/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (err) {
      console.error('Error loading wallet:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert('Please log in');
      return;
    }

    if (!creatorId) {
      alert('Creator ID required');
      return;
    }

    if (!title || !description || !budget || budget <= 0) {
      alert('Please fill in all fields');
      return;
    }

    if (wallet && wallet.lipzBalance < budget) {
      alert(`Insufficient Lipz balance. You have ${wallet.lipzBalance} Lipz, but need ${budget} Lipz.`);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/custom-requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          creatorId,
          title,
          description,
          budget: parseInt(budget),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      alert('Request sent! 🎉 Lipz are held in escrow until the creator accepts.');
      router.push('/custom-requests');
    } catch (err) {
      console.error('Error creating request:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to create a custom request.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>New Custom Request - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">New Custom Request ✨</h1>
            <p className="text-gray-400">Request personalized content from a creator</p>
          </div>

          {/* Wallet Balance */}
          {wallet && (
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1">Your Lipz Balance</div>
              <div className="text-3xl font-bold text-blue-400">{wallet.lipzBalance} Lipz</div>
              <p className="text-xs text-gray-500 mt-2">Funds will be held in escrow until completion</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Request Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Custom photoshoot in red dress"
                required
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly what you want... be specific about poses, outfits, setting, etc."
                required
                rows={6}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: The more detail you provide, the better the result!
              </p>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-2">Budget (Lipz)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1"
                required
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Funds will be held in escrow and only released when the creator completes your request
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-2">How it works:</h3>
              <ol className="space-y-1 text-sm text-gray-300">
                <li>1. Your Lipz are held in secure escrow</li>
                <li>2. Creator reviews and accepts/declines your request</li>
                <li>3. If accepted, creator works on your custom content</li>
                <li>4. Once delivered and you're happy, payment is released</li>
                <li>5. If declined, you get a full refund automatically</li>
              </ol>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !wallet || wallet.lipzBalance < budget}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Request...' : `Send Request (${budget} Lipz)`}
            </button>

            {wallet && wallet.lipzBalance < budget && (
              <p className="text-center text-red-400 text-sm">
                Insufficient balance. You need {budget - wallet.lipzBalance} more Lipz.
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}