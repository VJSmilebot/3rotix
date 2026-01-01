import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function BundleMarketplace() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllBundles();
  }, []);

  async function loadAllBundles() {
    setLoading(true);
    try {
      // TODO: Create /api/bundles/all endpoint to fetch all active bundles
      const res = await fetch('/api/bundles/all');
      if (res.ok) {
        const data = await res.json();
        setBundles(data);
      }
    } catch (err) {
      console.error('Error loading bundles:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Bundle Marketplace - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Bundle Marketplace 📦</h1>
          <p className="text-gray-400 mb-8">Unlock exclusive content bundles from creators</p>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading bundles...</div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No bundles available yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bundles.map((bundle) => (
                <Link
                  key={bundle.id}
                  href={`/bundles/${bundle.id}`}
                  className="group"
                >
                  <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-pink-600/50 transition-all">
                    <div className="relative h-48 bg-gradient-to-br from-pink-900/20 to-purple-900/20">
                      {bundle.coverImage ? (
                        <img
                          src={bundle.coverImage}
                          alt={bundle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
                          📦
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 bg-pink-600 rounded-full text-xs font-bold">
                        {bundle.price} Lipz
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-pink-400 transition-colors">
                        {bundle.title}
                      </h3>
                      {bundle.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {bundle.description}
                        </p>
                      )}
                      <div className="text-gray-500 text-sm">
                        {bundle.items?.length || 0} items • {bundle._count?.purchases || 0} sales
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}