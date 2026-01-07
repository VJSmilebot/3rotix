import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { getSupabaseClient } from "../utils/supabase/client";

export default function Me() {
  const { user, ready } = useAuth();

  const logout = async () => {
    const sb = getSupabaseClient();
    await sb.auth.signOut();
    window.location.href = "/";
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-white">
        <p className="text-white/70">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-white">
        <h1 className="text-2xl font-bold">Me</h1>
        <p className="mt-2 text-white/70">You’re not logged in.</p>
        <Link className="mt-4 inline-flex rounded-full px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10" href="/login">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-white">
      <h1 className="text-2xl font-bold">Me</h1>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-white/80"><span className="text-white/50">Email:</span> {user.email}</p>
        <p className="text-white/80"><span className="text-white/50">Name:</span> {user.user_metadata?.name || "(not set)"}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/creator-portal" className="inline-flex rounded-full px-4 py-2 bg-pink-600 hover:bg-pink-500 font-semibold">
            Go to Studio
          </Link>
          <button onClick={logout} className="inline-flex rounded-full px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10">
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
