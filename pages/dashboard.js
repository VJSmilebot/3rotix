// /pages/dashboard.js
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAuthedPrismaUser } from "../hooks/useAuthedPrismaUser";
import RankProgress from "../components/RankProgress";
import RecentXP from "../components/RecentXP";
import AchievementGrid from "../components/AchievementGrid";

// client-only ImpactBar
const ImpactBar = dynamic(() => import("../components/ImpactBar"), { ssr: false });

export default function DashboardPage() {
  const { loading: authLoading, error: authError, supabaseUser, prismaUser } =
    useAuthedPrismaUser();

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
        setErr(null);
        const r = await fetch(
          `/api/user/overview?userId=${encodeURIComponent(prismaUser.id)}`
        );
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data?.error) throw new Error(data?.error || "Failed to load overview");
        setOverview(data);
      } catch (e) {
        setErr(String(e?.message || e));
        setOverview(null);
      } finally {
        setLoadingOverview(false);
      }
    }

    setLoadingOverview(true);
    load();
  }, [prismaUser?.id]);

  // ✅ bulletproof stats object (prevents monthXp crash)
  const stats = useMemo(() => {
    const s = overview?.stats || {};
    return {
      monthXp: Number.isFinite(s.monthXp) ? s.monthXp : 0,
      totalXp: Number.isFinite(s.totalXp) ? s.totalXp : 0,
      rank: s.rank || prismaUser?.rank || "ROOKIE",
      nextRank: s.nextRank || null,
      toNext: Number.isFinite(s.toNext) ? s.toNext : 0,
      pctToNext: Number.isFinite(s.pctToNext) ? s.pctToNext : 0,
      nextThreshold: Number.isFinite(s.nextThreshold) ? s.nextThreshold : null,
    };
  }, [overview, prismaUser?.rank]);

  const xpPaused = !!overview?.xpPaused;

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Your Dashboard</h1>
            <p className="text-white/60 text-sm">
              Track your rank, XP, and community impact.
            </p>
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
                target="_blank"
                rel="noopener noreferrer"
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
          <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-3">
            {authError}
          </div>
        ) : !supabaseUser ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
            You’re not signed in.{" "}
            <a href="/login" className="text-pink-400 hover:underline">
              Sign in
            </a>{" "}
            to see your dashboard.
          </div>
        ) : loadingOverview ? (
          <div className="text-white/60">Loading your stats…</div>
        ) : err ? (
          <div className="rounded-xl border border-white/10 bg-red-500/10 text-red-200 p-3">
            {err}
          </div>
        ) : overview ? (
          <>
            {xpPaused ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                XP is currently <span className="text-white">paused</span>. Your profile
                still works; stats will show zeros until XP is enabled.
              </div>
            ) : null}

            {/* Top cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">This Month</div>
                <div className="text-white text-2xl font-semibold tabular-nums">
                  {(stats.monthXp ?? 0).toLocaleString()} XP
                </div>
                <div className="text-white/50 text-xs mt-1">Since the 1st</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">All-Time</div>
                <div className="text-white text-2xl font-semibold tabular-nums">
                  {(stats.totalXp ?? 0).toLocaleString()} XP
                </div>
                <div className="text-white/50 text-xs mt-1">Lifetime total</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/80 text-sm">Current Rank</div>
                <div className="text-white text-2xl font-semibold">{stats.rank}</div>
                <div className="text-white/50 text-xs mt-1">
                  {stats.nextRank
                    ? `${(stats.toNext ?? 0).toLocaleString()} XP to ${stats.nextRank}`
                    : "Max rank reached"}
                </div>
              </div>
            </section>

            <RankProgress
              rank={stats.rank}
              totalXp={stats.totalXp}
              nextRank={stats.nextRank}
              pctToNext={stats.pctToNext}
              toNext={stats.toNext}
              nextThreshold={stats.nextThreshold}
            />

            {/* Achievements */}
            <AchievementGrid
              allMeta={overview.allBadges || overview.allMeta || []}
              earned={overview.badges || overview.earned || []}
            />

            <RecentXP logs={overview.recent || []} />
          </>
        ) : (
          <div className="text-white/60">No data.</div>
        )}
      </div>
    </main>
  );
}
