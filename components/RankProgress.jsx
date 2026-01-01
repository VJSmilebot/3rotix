// /components/RankProgress.jsx
import React from "react";

export default function RankProgress({ rank, totalXp, nextRank, pctToNext, toNext, nextThreshold }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white/80 text-sm">Current Rank</div>
          <div className="text-white text-xl font-semibold">{rank}</div>
        </div>
        <div className="text-right">
          <div className="text-white/80 text-sm">Total XP</div>
          <div className="text-white text-xl font-semibold tabular-nums">{totalXp.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs text-white/60">
          <span>Progress to {nextRank ?? "MAX"}</span>
          {nextRank ? (
            <span>{pctToNext}% • {toNext.toLocaleString()} XP to {nextRank}</span>
          ) : (
            <span>Max rank reached</span>
          )}
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-pink-500 transition-[width] duration-500" style={{ width: `${pctToNext}%` }} />
        </div>
        {nextRank && (
          <div className="mt-1 text-[11px] text-white/40">
            Next threshold: {nextThreshold?.toLocaleString()} XP
          </div>
        )}
      </div>
    </div>
  );
}
