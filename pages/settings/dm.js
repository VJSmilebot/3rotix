import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function DMSettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    allowDMs: true,
    requireUnlock: false,
    unlockPrice: 500,
    autoResponse: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = getSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadSettings();
      } else {
        router.push('/login');
      }
    }
    init();
  }, []);

  async function loadSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/messages/settings', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({
          allowDMs: data.allowDMs ?? true,
          requireUnlock: data.requireUnlock ?? false,
          unlockPrice: data.unlockPrice ?? 500,
          autoResponse: data.autoResponse || '',
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/messages/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>DM Settings - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold mb-2">DM Settings ⚙️</h1>
            <p className="text-gray-400">Control who can message you and how</p>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Allow DMs */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">Allow Direct Messages</h3>
                  <p className="text-sm text-gray-400">
                    Let fans and subscribers send you messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowDMs}
                    onChange={(e) => setSettings({ ...settings, allowDMs: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Require Unlock */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">Require Unlock</h3>
                  <p className="text-sm text-gray-400">
                    Fans must pay to unlock your DMs before sending messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireUnlock}
                    onChange={(e) => setSettings({ ...settings, requireUnlock: e.target.checked })}
                    disabled={!settings.allowDMs}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {settings.requireUnlock && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Unlock Price (Lipz)</label>
                  <input
                    type="number"
                    value={settings.unlockPrice}
                    onChange={(e) => setSettings({ ...settings, unlockPrice: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You'll receive ${(settings.unlockPrice * 0.9 / 100).toFixed(2)} per unlock (90% after fees)
                  </p>
                </div>
              )}
            </div>

            {/* Auto Response */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-1">Auto-Response</h3>
              <p className="text-sm text-gray-400 mb-4">
                Automatically send this message when someone messages you for the first time
              </p>

              <textarea
                value={settings.autoResponse}
                onChange={(e) => setSettings({ ...settings, autoResponse: e.target.value })}
                placeholder="Hey! Thanks for messaging me. I'll get back to you soon! 💬"
                rows={4}
                disabled={!settings.allowDMs}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none resize-none disabled:opacity-50"
              />

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>💡 Tip:</span>
                <span>Keep it friendly and let them know when to expect a reply</span>
              </div>
            </div>

            {/* Blocked Users */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">Blocked Users</h3>
                  <p className="text-sm text-gray-400">
                    Manage users you've blocked from messaging you
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all text-sm">
                  View List
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                  saved
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
            <h3 className="font-bold text-blue-400 mb-3">💡 DM Settings Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Unlock fees create recurring revenue from your most engaged fans</li>
              <li>• Auto-responses keep fans happy while you're busy</li>
              <li>• Subscribers typically get free access to DMs (coming soon!)</li>
              <li>• You can block/unblock users anytime from the conversation</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}