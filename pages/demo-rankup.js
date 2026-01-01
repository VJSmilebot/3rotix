import { useState } from "react";
import RankUpToast from "../components/RankUpToast";
import BadgeToast from "../components/BadgeToast";

export default function DemoRankUp() {
  const [toastData, setToastData] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);

  const userId = sessionStorage.getItem("prismaUserId") || ""; // or your hook

  async function giveXp(amount = 25) {
    if (!userId) return alert("Sign in first");

    const out = await fetch("/api/xp/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        actionType: "test",
        xpValue: amount,
        idempotencyKey: `demo-${userId}-${Date.now()}`,
      }),
    }).then((r) => r.json());

    if (out?.ok) {
      setToastData(out); // rank toast
      if (Array.isArray(out.newBadges) && out.newBadges.length) {
        setBadgeQueue(out.newBadges); // badge toast
      }
    } else if (out?.idempotent) {
      // ignore
    } else if (out?.error) {
      alert(out.error);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
      <h1 className="text-2xl font-semibold">Badge + Rank Toast Demo</h1>
      <div className="flex gap-4">
        <button onClick={() => giveXp(25)}  className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600">Give 25 XP</button>
        <button onClick={() => giveXp(200)} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">Give 200 XP</button>
      </div>

      <RankUpToast trigger={toastData} onClose={() => setToastData(null)} />
      <BadgeToast newBadges={badgeQueue} onClose={() => setBadgeQueue([])} />
    </main>
  );
}
