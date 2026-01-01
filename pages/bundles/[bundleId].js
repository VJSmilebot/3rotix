import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../../utils/supabase/client';

export default function BundleDetailPage() {
  const router = useRouter();
  const { bundleId } = router.query;
  
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (bundleId) {
      loadBundle();
    }
  }, [bundleId]);

  async function loadBundle() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {};
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/bundles/${bundleId}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setBundle(data);
        setHasPurchased(data.hasPurchased || false);
      } else {
        console.error('Failed to load bundle');
      }
    } catch (err) {
      console.error('Error loading bundle:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('Please log in to purchase this bundle');
      return;
    }

    if (!confirm(`Purchase "${bundle.title}" for ${bundle.price} Lipz?`)) {
      return;
    }

    setPurchasing(true);

    try {
      const res = await fetch(`/api/bundles/${bundleId}/purchase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      alert(`🎉 Purchase successful! You now own "${bundle.title}"`);
      loadBundle(); // Reload to show purchased state
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.message || 'Failed to purchase bundle');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Loading bundle...</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Bundle not found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{bundle.title} - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Cover Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-pink-900/20 to-purple-900/20">
              {bundle.coverImage ? (
                <img
                  src={bundle.coverImage}
                  alt={bundle.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-9xl">
                  📦
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="mb-4">
                <h1 className="text-4xl font-bold mb-2">{bundle.title}</h1>
                <p className="text-gray-400">{bundle.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-2xl font-bold text-pink-400">{bundle.price} Lipz</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Items:</span>
                  <span className="font-bold">{bundle.items?.length || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Type:</span>
                  <span className="font-bold">{bundle.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Sales:</span>
                  <span className="font-bold">{bundle._count?.purchases || 0}</span>
                </div>
              </div>

              {hasPurchased ? (
                <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4 mb-4">
                  <p className="text-green-400 font-bold">✓ You own this bundle</p>
                  <p className="text-sm text-green-300 mt-1">Access the content below</p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Processing...' : `Purchase for ${bundle.price} Lipz`}
                </button>
              )}
            </div>
          </div>

          {/* Bundle Contents */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-2xl font-bold mb-4">Bundle Contents</h2>

            {!hasPurchased ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-2">🔒 Locked</p>
                <p className="text-sm text-gray-500">Purchase this bundle to unlock all content</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bundle.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden"
                  >
                    {item.mediaType === 'IMAGE' && (
                      <div className="aspect-square bg-gray-900">
                        {/* TODO: Fetch and display actual image */}
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🖼️
                        </div>
                      </div>
                    )}
                    {item.mediaType === 'VIDEO' && (
                      <div className="aspect-video bg-gray-900 flex items-center justify-center text-4xl">
                        🎥
                      </div>
                    )}
                    {item.mediaType === 'AUDIO' && (
                      <div className="aspect-square bg-gray-900 flex items-center justify-center text-4xl">
                        🎵
                      </div>
                    )}
                    <div className="p-2 text-xs text-gray-400">
                      {item.mediaType} #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}