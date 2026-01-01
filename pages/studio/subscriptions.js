import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function ManageSubscriptionTiers() {
  const [user, setUser] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadTiers(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadTiers(userId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/tiers/by-creator/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTiers(data);
      }
    } catch (err) {
      console.error('Error loading tiers:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalSubscribers = tiers.reduce((sum, tier) => sum + (tier._count?.subscribers || 0), 0);
  const monthlyRevenue = tiers.reduce((sum, tier) => 
    sum + (tier.pricePerMonth * (tier._count?.subscribers || 0)), 0
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to manage subscription tiers.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Subscription Tiers - 3rotix Studio</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Subscription Tiers 💎</h1>
              <p className="text-gray-400">Manage your membership levels</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30"
            >
              + Create Tier
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Total Tiers</div>
              <div className="text-4xl font-bold">{tiers.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Total Subscribers</div>
              <div className="text-4xl font-bold text-blue-400">{totalSubscribers}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 rounded-xl p-6">
              <div className="text-gray-300 text-sm mb-2">Monthly Revenue</div>
              <div className="text-4xl font-bold text-green-400">{monthlyRevenue} Lipz</div>
              <div className="text-xs text-gray-400 mt-1">${(monthlyRevenue * 0.9).toFixed(2)}/mo</div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-400 mb-3">💡 Subscription Tier Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Create multiple tiers at different price points to maximize revenue</li>
              <li>• Offer free trials to convert more subscribers</li>
              <li>• Clearly define benefits for each tier</li>
              <li>• Higher tiers should offer exclusive content and perks</li>
              <li>• Subscribers auto-renew monthly with their Lipz balance</li>
            </ul>
          </div>

          {/* Tiers List */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading tiers...</div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-20 bg-[#0f0f0f] border border-gray-800 rounded-xl">
              <div className="text-6xl mb-4">💎</div>
              <p className="text-gray-400 mb-6">No subscription tiers yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
              >
                Create Your First Tier
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <TierCard 
                  key={tier.id} 
                  tier={tier}
                  onUpdate={() => loadTiers(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTierModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTiers(user.id);
          }}
        />
      )}
    </>
  );
}

function TierCard({ tier, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div 
        className="bg-[#0f0f0f] border-2 rounded-xl overflow-hidden hover:border-blue-600/50 transition-all cursor-pointer"
        style={{ borderColor: tier.color || '#374151' }}
        onClick={() => setShowEdit(true)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{tier.description}</p>
            </div>
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: tier.color || '#6B7280' }}
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-bold" style={{ color: tier.color }}>
              {tier.pricePerMonth} Lipz
            </div>
            <div className="text-sm text-gray-500">
              ${(tier.pricePerMonth * 0.9 / 100).toFixed(2)}/month
            </div>
          </div>

          {/* Benefits */}
          {tier.benefits && tier.benefits.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-400 mb-2">BENEFITS</div>
              <ul className="space-y-1 text-sm text-gray-300">
                {tier.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="line-clamp-1">{benefit}</span>
                  </li>
                ))}
                {tier.benefits.length > 3 && (
                  <li className="text-xs text-gray-500">+{tier.benefits.length - 3} more...</li>
                )}
              </ul>
            </div>
          )}

          {/* Trial */}
          {tier.trialDays > 0 && (
            <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg px-3 py-2 mb-4">
              <div className="text-xs font-bold text-yellow-400">
                🎁 {tier.trialDays} Day Free Trial
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-800">
            <div>
              <span className="text-gray-400">Subscribers:</span>
              <span className="font-bold ml-2">{tier._count?.subscribers || 0}</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              tier.isActive 
                ? 'bg-green-600/20 text-green-400' 
                : 'bg-gray-600/20 text-gray-400'
            }`}>
              {tier.isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditTierModal
          tier={tier}
          onClose={() => setShowEdit(false)}
          onUpdate={() => {
            setShowEdit(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

function CreateTierModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(100);
  const [benefits, setBenefits] = useState(['']);
  const [color, setColor] = useState('#6366f1');
  const [trialDays, setTrialDays] = useState(0);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  const presetColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
    '#f59e0b', '#10b981', '#06b6d4', '#6b7280'
  ];

  function addBenefit() {
    setBenefits([...benefits, '']);
  }

  function updateBenefit(index, value) {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  }

  function removeBenefit(index) {
    setBenefits(benefits.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validBenefits = benefits.filter(b => b.trim());
    if (!name || !price || price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/subscriptions/tiers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          description,
          pricePerMonth: parseInt(price),
          benefits: validBenefits,
          color,
          trialDays: parseInt(trialDays),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tier');
      }

      alert('Tier created! 🎉');
      onSuccess();
    } catch (err) {
      console.error('Error creating tier:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-gray-800 rounded-xl max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create Subscription Tier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Tier Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VIP Access, Gold Member, Exclusive"
              required
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this tier special?"
              rows={2}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Price per Month (Lipz) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="1"
              required
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll receive ${(price * 0.9 / 100).toFixed(2)}/month per subscriber (90% after platform fee)
            </p>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Benefits</label>
              <button
                type="button"
                onClick={addBenefit}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add Benefit
              </button>
            </div>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder={`Benefit ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                  />
                  {benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme Color</label>
            <div className="flex gap-2 mb-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    color === presetColor ? 'border-white scale-110' : 'border-gray-700'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 bg-black border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Trial Days */}
          <div>
            <label className="block text-sm font-medium mb-2">Free Trial Period (days)</label>
            <input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              min="0"
              max="30"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = No trial, charge immediately. Recommended: 3-7 days
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Tier'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTierModal({ tier, onClose, onUpdate }) {
  const [name, setName] = useState(tier.name);
  const [description, setDescription] = useState(tier.description || '');
  const [price, setPrice] = useState(tier.pricePerMonth);
  const [benefits, setBenefits] = useState(tier.benefits.length > 0 ? tier.benefits : ['']);
  const [color, setColor] = useState(tier.color || '#6366f1');
  const [isActive, setIsActive] = useState(tier.isActive);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  async function handleUpdate(e) {
    e.preventDefault();
    
    const validBenefits = benefits.filter(b => b.trim());
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/subscriptions/tiers/${tier.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          description,
          pricePerMonth: parseInt(price),
          benefits: validBenefits,
          color,
          isActive,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      alert('Tier updated! ✅');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${tier.name}" tier? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/subscriptions/tiers/${tier.id}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete');

      alert('Tier deleted');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#111] border border-gray-800 rounded-xl max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Tier</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          {/* Similar fields as CreateTierModal */}
          <div>
            <label className="block text-sm font-medium mb-2">Tier Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price per Month (Lipz) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="1"
              required
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-medium">Active (visible to subscribers)</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Tier'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}