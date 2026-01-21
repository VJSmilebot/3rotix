// pages/collabs/index.js
import { useEffect, useState } from "react";
import Link from "next/link";

function Pill({ children }) {
  return <span className="px-2 py-1 rounded-full text-xs border border-white/10 bg-white/5">{children}</span>;
}

export default function CollabsIndex() {
  const [box, setBox] = useState("inbox");
  const [state, setState] = useState({ loading: true, error: null, proposals: [] });

  async function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await fetch(`/api/collabs/proposals/list?box=${box}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "failed");
      setState({ loading: false, error: null, proposals: j.proposals || [] });
    } catch (e) {
      setState({ loading: false, error: e.message || "error", proposals: [] });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Collabs</h1>
            <p className="text-white/60 text-sm">Proposals, versioned terms, shared workspace files.</p>
          </div>
          <Link href="/collabs/new" className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90">
            New Proposal
          </Link>
        </div>

        <div className="mt-6 flex gap-2">
          {["inbox", "outbox", "all"].map((b) => (
            <button
              key={b}
              onClick={() => setBox(b)}
              className={`px-3 py-2 rounded-xl border text-sm ${
                box === b ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {b.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {state.loading && <div className="text-white/60">Loading…</div>}
          {state.error && <div className="text-red-400">Error: {state.error}</div>}

          {!state.loading && !state.error && state.proposals.length === 0 && (
            <div className="text-white/60 border border-white/10 rounded-2xl p-6 bg-white/5">No proposals yet.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.proposals.map((p) => (
              <Link
                key={p.id}
                href={`/collabs/p/${p.id}`}
                className="block border border-white/10 rounded-2xl p-5 bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{p.title || "Collab Proposal"}</div>
                  <Pill>{p.status}</Pill>
                </div>

                <div className="mt-2 text-sm text-white/60 line-clamp-2">{p.note || "No note."}</div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                  <Pill>from: {p.createdBy?.handle || "?"}</Pill>
                  <Pill>to: {p.recipient?.handle || "?"}</Pill>
                  {p.workspace?.id ? <Pill>workspace</Pill> : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
