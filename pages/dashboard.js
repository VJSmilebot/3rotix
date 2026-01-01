// /pages/dashboard.js
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuthedPrismaUser } from "../hooks/useAuthedPrismaUser";
import RankProgress from "../components/RankProgress";
import RecentXP from "../components/RecentXP";
import AchievementGrid from "../components/AchievementGrid";
// client-only ImpactBar
const ImpactBar = dynamic(() => import("../components/ImpactBar"), { ssr: false });

export default function DashboardPage() {
  const { loading: authLoading, error: authError, supabaseUser, prismaUser } = useAuthedPrismaUser();
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [err, setErr] = useState(null);

  // fetch overview once prismaUser is ready
  useEffect(() => {
    async function load() {
      if (!prismaUser?.id) {
        setOverview(null);
        setLoadingOverview(false);
        return;
      }
      try {
        const data = await fetch(`/api/user/overview?userId=${encodeURIComponent(prismaUser.id)}`).then((r) => r.json());
        if (data?.error) throw new Error(data.error);
        setOverview(data);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoadingOverview(false);
      }
    }
    setLoadingOverview(true);
    load();
  }, [prismaUser?.id]);

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Your Dashboard</h1>
            <p className="text-white/60 text-sm">Track your rank, XP, and community impact.</p>
          </div>
          <div className="flex items-center gap-2">
            {!supabaseUser ? (
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
              >
                Sign in
              </a>
            ) : (
              <a
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
                target="_blank" rel="noopener noreferrer"
              >
                View Leaderboard
              </a>
            )}
          </div>
        </header>

        <ImpactBar />

        {/* states */}
        {authLoading ? (
          <div className="text-white/60">Loading session…</div>
        ) : authError ? (
          <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-3">{authError}</div>
        ) : !supabaseUser ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
            You’re not signed in. <a href="/login" className="text-pink-400 hover:underline">Sign in</a> to see your dashboard.
          </div>
        ) : loadingOverview ? (
          <div className="text-white/60">Loading your stats…</div>
        ) : err ? (
          <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-3">{err}</div>
        ) : overview ? (
          <>
            {/* Top cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">This Month</div>
                <div className="text-white text-2xl font-semibold tabular-nums">
                  {overview.stats.monthXp.toLocaleString()} XP
                </div>
                <div className="text-white/50 text-xs mt-1">Since the 1st</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">All-Time</div>
                <div className="text-white text-2xl font-semibold tabular-nums">
                  {overview.stats.totalXp.toLocaleString()} XP
                </div>
                <div className="text-white/50 text-xs mt-1">Lifetime total</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">Current Rank</div>
                <div className="text-white text-2xl font-semibold">{overview.stats.rank}</div>
                <div className="text-white/50 text-xs mt-1">
                  {overview.stats.nextRank
                    ? `${overview.stats.toNext.toLocaleString()} XP to ${overview.stats.nextRank}`
                    : "Max rank reached"}
                </div>
              </div>
            </section>

            <RankProgress
              rank={overview.stats.rank}
              totalXp={overview.stats.totalXp}
              nextRank={overview.stats.nextRank}
              pctToNext={overview.stats.pctToNext}
              toNext={overview.stats.toNext}
              nextThreshold={overview.stats.nextThreshold}
            />

            {/* Achievements */}
            <AchievementGrid
              allMeta={overview.allBadges || overview.allMeta || []}
              earned={overview.badges || overview.earned || []}
            />

            <RecentXP logs={overview.recent} />
          </>
        ) : (
          <div className="text-white/60">No data.</div>
        )}
      </div>
    </main>
  );
}
