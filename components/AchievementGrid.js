// /components/AchievementGrid.jsx
// expects `allMeta` (array of available badges) and `earned` (from overview.badges)
import Image from "next/image";

export default function AchievementGrid({ allMeta = [], earned = [] }) {
  const have = new Set(earned.map((b) => b.type));
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 p-6">
      <h2 className="text-white font-semibold mb-4">Your Achievements</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
        {allMeta.map((b) => {
          const unlocked = have.has(b.key);
          const img = unlocked ? b.image : (b.locked || b.image);
          return (
            <div key={b.key} className={`group relative flex flex-col items-center ${unlocked ? "" : "opacity-70 grayscale"} transition-transform hover:scale-105`}>
              <div className="relative h-16 w-16">
                <Image src={img} alt={b.label} fill sizes="64px"
                       className={`object-contain ${unlocked ? "drop-shadow-[0_0_10px_rgba(255,0,179,0.6)]" : ""}`} />
              </div>
              <span className="mt-2 text-xs text-white/80">{b.label}</span>
              <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-lg bg-black/90 border border-white/10 px-2 py-1 text-[11px] text-white/80 opacity-0 group-hover:opacity-100 transition">
                {b.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
