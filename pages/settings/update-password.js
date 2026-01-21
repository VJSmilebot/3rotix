// pages/settings/update-password.js
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSupabaseClient } from "../../utils/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSubmit = password.length >= 8 && password === confirm && ready && !saving;

  // Supabase sets session after user clicks recovery link; poll briefly until present
  useEffect(() => {
    let id = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        clearInterval(id);
        setReady(true);
      }
    }, 800);

    return () => clearInterval(id);
  }, [supabase]);

  const submit = async (e) => {
    e.preventDefault();

    if (!password || password !== confirm) {
      alert("Passwords must match.");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setSaved(false);

    const { error } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // send them somewhere sane
    router.push("/settings");
  };

  return (
    <>
      <Head>
        <title>Update Password - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header (DM Settings style) */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/settings")}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold mb-2">Update Password 🔐</h1>
            <p className="text-gray-400">Keep your account locked down.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
              {!ready ? (
                <div>
                  <h3 className="font-bold text-lg mb-1">Preparing session…</h3>
                  <p className="text-sm text-gray-400">
                    If you just clicked a reset link, give it a second. This page
                    needs a valid session to update your password.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      New password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                      placeholder="Type it again"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>💡</span>
                    <span>
                      Use a passphrase. “weird sentence + numbers” beats “P@ssw0rd123”.
                    </span>
                  </div>

                  <div className="sticky bottom-6">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                        saved
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {saving ? "Saving..." : saved ? "✓ Updated!" : "Update password"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
              <h3 className="font-bold text-blue-400 mb-3">💡 Password Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• 12+ characters is the sweet spot</li>
                <li>• Don’t reuse passwords from other platforms</li>
                <li>• If you got logged out mid-flow, re-open the reset link</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
