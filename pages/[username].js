import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../utils/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  
  const [profile, setProfile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' or 'bundles'

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      // Fetch profile
      const profileRes = await fetch(`/api/profile/${username}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // Fetch tiers
        const tiersRes = await fetch(`/api/subscriptions/tiers/by-creator/${profileData.id}`);
        if (tiersRes.ok) {
          const tiersData = await tiersRes.json();
          setTiers(tiersData);
        }

        // Fetch bundles
        const bundlesRes = await fetch(`/api/bundles/by-creator/${profileData.id}`);
        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          setBundles(bundlesData);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.displayName || profile.username} - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Profile Header */}
        <div className="bg-gradient-to-b from-purple-900/20 to-black border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-start gap-6">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-600"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-5xl font-bold">
                  {(profile.displayName || profile.username)[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{profile.displayName || profile.username}</h1>
                <p className="text-xl text-gray-400 mb-4">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>👥 {tiers.reduce((sum, t) => sum + (t._count?.subscribers || 0), 0)} Subscribers</span>
                  <span>📦 {bundles.length} Bundles</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-4 px-2 font-bold border-b-2 transition-all ${
                  activeTab === 'subscriptions'
                    ? 'border-blue-600 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                💎 Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('bundles')}
                className={`py-4 px-2 font-bold border-b-2 transition-all ${
                  activeTab === 'bundles'
                    ? 'border-blue-600 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                📦 Bundles
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {activeTab === 'subscriptions' && (
            <SubscriptionTiersSection tiers={tiers} onSubscribe={loadProfile} />
          )}
          
          {activeTab === 'bundles' && (
            <BundlesSection bundles={bundles} />
          )}
        </div>
      </div>
    </>
  );
}

function SubscriptionTiersSection({ tiers, onSubscribe }) {
  const [subscribing, setSubscribing] = useState(null);
  const supabase = getSupabaseClient();

  async function handleSubscribe(tierId) {
    setSubscribing(tierId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in to subscribe');
        return;
      }

      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tierId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      alert(data.message || 'Subscribed successfully! 🎉');
      onSubscribe();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubscribing(null);
    }
  }

  if (tiers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">💎</div>
        <p className="text-gray-400">No subscription tiers available yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className="bg-[#0f0f0f] border-2 rounded-xl overflow-hidden hover:scale-105 transition-all"
          style={{ borderColor: tier.color || '#374151' }}
        >
          <div className="p-6">
            {/* Tier Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              {tier.description && (
                <p className="text-sm text-gray-400">{tier.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2" style={{ color: tier.color }}>
                {tier.pricePerMonth}
              </div>
              <div className="text-sm text-gray-400">Lipz/month</div>
              {tier.trialDays > 0 && (
                <div className="mt-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-yellow-400">
                    🎁 {tier.trialDays} Day Free Trial
                  </span>
                </div>
              )}
            </div>

            {/* Benefits */}
            {tier.benefits && tier.benefits.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-gray-400 mb-3">WHAT'S INCLUDED</div>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subscribe Button */}
            <button
              onClick={() => handleSubscribe(tier.id)}
              disabled={subscribing === tier.id}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: tier.color,
                boxShadow: `0 10px 40px -10px ${tier.color}50`,
              }}
            >
              {subscribing === tier.id ? 'Processing...' : 'Subscribe Now'}
            </button>

            {/* Subscriber Count */}
            <div className="text-center mt-4 text-sm text-gray-500">
              {tier._count?.subscribers || 0} subscribers
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BundlesSection({ bundles }) {
  if (bundles.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-400">No bundles available yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <div key={bundle.id} className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-600/50 transition-all">
          {bundle.thumbnailUrl && (
            <img
              src={bundle.thumbnailUrl}
              alt={bundle.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{bundle.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{bundle.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-400">{bundle.price} Lipz</div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all">
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}