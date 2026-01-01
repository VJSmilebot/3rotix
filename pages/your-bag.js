import { useEffect, useState } from "react";
import { getSupabaseClient } from "../utils/supabase/client";

export default function YourBag() {
  const [loading, setLoading] = useState(true);
  const [lipz, setLipz] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);

  const supabase = getSupabaseClient();

  // Load balances & transactions
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Get current user and session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.warn("No user logged in.");
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Call API with auth token
      const res = await fetch("/api/wallet/get-balances", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch balances:", await res.text());
        setLoading(false);
        return;
      }

      const data = await res.json();

      setLipz(data.lipzBalance || 0);
      setEarnings(data.creatorEarningsCents || 0);
      setIsCreator(data.isCreator || false);
      setTransactions(data.recentTransactions || []);

      setLoading(false);
    }

    load();
  }, []);

  // Add Lipz (Beta)
  async function addLipz() {
    if (!user) return alert("You must be logged in.");

    // Get fresh session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return alert("Session expired. Please log in again.");

    const res = await fetch("/api/wallet/add-lipz-simulated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });

    if (!res.ok) {
      console.error("Failed to add Lipz:", await res.text());
      return alert("Failed to add Lipz");
    }

    const data = await res.json();
    if (data.lipzBalance !== undefined) {
      setLipz(data.lipzBalance);
    }
  }

  const typeColors = {
    TIP: "text-pink-400",
    LOAD_LIPZ_SIMULATED: "text-purple-400",
    BUNDLE_PURCHASE: "text-blue-400",
    EVENT_TICKET: "text-green-400",
    CUSTOM_REQUEST: "text-yellow-400",
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-10 flex flex-col items-center">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-2 tracking-wide neon-pink">
        YOUR BAG 💼
      </h1>
      <p className="text-gray-400 mb-8">Stack it. Spend it. Flex it.</p>

      <div className="w-full max-w-3xl space-y-8">
        {/* Lipz Card */}
        <div className="bg-[#0f0f0f] p-6 rounded-xl border border-pink-600/30 shadow-[0_0_20px_rgba(255,0,120,0.25)]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lipz Balance</h2>
            <button
              onClick={addLipz}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-md text-sm font-bold transition-all shadow-md shadow-pink-500/30"
            >
              + Add Lipz (Beta)
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : (
            <p className="text-5xl font-bold mt-4">{lipz}</p>
          )}

          <p className="mt-1 text-gray-400 text-sm">
            Lipz power your tips, bundles, custom requests, and event tickets.
          </p>
        </div>

        {/* Creator Earnings */}
        {isCreator && (
          <div className="bg-[#0f0f0f] p-6 rounded-xl border border-purple-600/30 shadow-[0_0_20px_rgba(151,0,255,0.25)]">
            <h2 className="text-xl font-semibold mb-4">Creator Earnings</h2>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <p className="text-5xl font-bold">
                ${(earnings / 100).toFixed(2)}
              </p>
            )}

            <p className="mt-1 text-gray-400 text-sm">
              Your cut from Lipz-powered purchases & tips.
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-[#0f0f0f] p-6 rounded-xl border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-600">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center border-b border-gray-700 pb-3"
                >
                  <div>
                    <p className={"font-bold " + (typeColors[tx.type] || "")}>
                      {tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-pink-300">
                      {tx.lipzAmount} Lipz
                    </p>
                    {tx.creatorNetCents > 0 && (
                      <p className="text-gray-400 text-sm">
                        Earned ${(tx.creatorNetCents / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .neon-pink {
          text-shadow: 0 0 12px rgba(255, 0, 150, 0.6),
            0 0 24px rgba(255, 0, 150, 0.3);
        }
      `}</style>
    </div>
  );
}
