// /pages/leaderboard.js
import dynamic from "next/dynamic";
const Leaderboard = dynamic(() => import("../components/Leaderboard"), { ssr: false });

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-8">
        <Leaderboard />
      </div>
    </main>
  );
}
