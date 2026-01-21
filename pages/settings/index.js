// pages/settings/index.js
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSupabaseClient } from "../../utils/supabase/client";

export default function SettingsIndex() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [sbUser, setSbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = confirm.trim().toUpperCase() === "DEACTIVATE";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setSbUser(data?.user || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  const deactivate = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account/deactivate", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Deactivate failed");
        return;
      }

      // always sign out locally and bounce
      try {
        await supabase.auth.signOut();
      } catch {}
      router.push("/login");
    } catch (e) {
      console.error(e);
      alert("Deactivate failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (!sbUser) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Settings ⚙️</h1>
          <p className="text-gray-400">You’re not logged in.</p>

          <button
            className="mt-6 w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/login")}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header (DM Settings style) */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold mb-2">Settings ⚙️</h1>
            <p className="text-gray-400">Manage your account and privacy.</p>
          </div>

          <div className="space-y-6">
            {/* Quick links */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Settings Menu</h3>
                  <p className="text-sm text-gray-400">
                    Jump to the stuff you actually care about.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/settings/dm")}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all text-sm"
                  >
                    DM Settings
                  </button>
                  <button
                    onClick={() => router.push("/settings/update-password")}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all text-sm"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-1">Account</h3>
              <p className="text-sm text-gray-400">
                Signed in as <span className="text-white">{sbUser.email}</span>
              </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#0f0f0f] border border-red-800/60 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-1 text-red-300">Deactivate account</h3>
              <p className="text-sm text-gray-400">
                This hides your profile, wipes public info, and disables access.
                Your email will be free to sign up again.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Type <span className="text-red-300">DEACTIVATE</span> to confirm
                </label>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-red-600 outline-none"
                  placeholder="DEACTIVATE"
                  aria-label="Type DEACTIVATE to confirm"
                />
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>💡</span>
                <span>
                  If you just want a break, deactivation is reversible later (we’ll add that).
                </span>
              </div>
            </div>

            {/* Sticky CTA (DM Settings vibe) */}
            <div className="sticky bottom-6">
              <button
                onClick={deactivate}
                disabled={!ready || busy}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Deactivating..." : "Deactivate my account"}
              </button>
            </div>

            {/* Info box (same energy as DM tips) */}
            <div className="mt-2 bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
              <h3 className="font-bold text-blue-400 mb-3">💡 Settings Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• DM Settings lets you control access + monetize attention</li>
                <li>• Update Password is safest from this page (not random links)</li>
                <li>• Deactivation is for “I’m done for now” — not punishment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
