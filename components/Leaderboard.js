// /components/Leaderboard.jsx
import { useEffect, useState } from "react";

function PeriodTabs({ period, setPeriod }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/50 p-1">
      {["month", "all"].map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1 text-sm rounded-lg transition ${
            period === p ? "bg-pink-500 text-white" : "text-white/80 hover:text-white"
          }`}
          aria-pressed={period === p}
        >
          {p === "month" ? "This Month" : "All-Time"}
        </button>
      ))}
    </div>
  );
}

function Row({ item }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-8 text-right text-white/70 tabular-nums">{item.position}</div>
        <img
          src={item.image || "/avatar.png"}
          alt=""
          className="w-9 h-9 rounded-full object-cover border border-white/10"
        />
        <div>
          <div className="text-white font-medium">
            {item.handle ? `@${item.handle}` : item.name || "Anon"}
          </div>
          <div className="text-xs text-white/60">Rank: {item.rank}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white font-semibold tabular-nums">
          {item.monthXp != null ? item.monthXp.toLocaleString() : 0} XP
        </div>
        <div className="text-xs text-white/60">
          Total: {item.totalXp?.toLocaleString() || 0}
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState("month");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const limit = 25;

  useEffect(() => {
    setOffset(0);
  }, [period]);

  useEffect(() => {
    fetch(`/api/leaderboard?period=${period}&limit=${limit}&offset=${offset}`)
      .then((r) => r.json())
      .then((d) => {
        if (offset === 0) setItems(d.items || []);
        else setItems((prev) => [...prev, ...(d.items || [])]);
        setNextOffset(d.nextOffset ?? null);
      })
      .catch(() => {});
  }, [period, offset]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
        <PeriodTabs period={period} setPeriod={setPeriod} />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Row key={`${period}-${item.userId}-${item.position}`} item={item} />
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        {nextOffset != null ? (
          <button
            onClick={() => setOffset(nextOffset)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20"
          >
            Load more
          </button>
        ) : (
          <div className="text-white/50 text-sm">End of list</div>
        )}
      </div>
    </section>
  );
}
