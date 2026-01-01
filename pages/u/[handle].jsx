import { useRouter } from "next/router";
import Link from "next/link";

export default function UserHandlePage() {
  const router = useRouter();
  const handle =
    typeof router.query.handle === "string"
      ? router.query.handle
      : "";

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70">
            {handle ? (
              <>
                Signed in as{" "}
                <span className="text-white font-semibold">@{handle}</span>
              </>
            ) : (
              "User dashboard (JS-only placeholder)."
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/squads"
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Squads
          </Link>
          <Link
            href="/streaming"
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500"
          >
            Go Live
          </Link>
        </div>
      </header>

      {/* Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-white font-semibold">XP</div>
          <div className="mt-2 text-white/70 text-sm">
            Placeholder stats until you wire in real user XP.
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>Level 3</span>
              <span>320 / 500</span>
            </div>
            <div className="h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div className="h-full w-[64%] bg-white/70" />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-white font-semibold">Recent activity</div>
          <ul className="mt-3 text-white/70 text-sm list-disc pl-5 space-y-2">
            <li>+25 XP for sharing a referral link</li>
            <li>Joined a squad</li>
            <li>Watched a stream</li>
          </ul>
        </div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-white font-semibold">Quick actions</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
            Edit profile
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
            Share referral
          </button>
          <button className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500">
            Tip a creator
          </button>
        </div>
      </section>
    </main>
  );
}
