// pages/collabs/new.js
import { useState } from "react";
import { useRouter } from "next/router";

const DEFAULT_TERMS = [
  { key: "split", label: "Revenue Split", value: "50/50" },
  { key: "deliverables", label: "Deliverables", value: "2 clips + 10 photos + 1 promo reel" },
  { key: "timeline", label: "Timeline", value: "Shoot within 14 days. Deliver edits within 7 days after shoot." },
  { key: "usage", label: "Usage Rights", value: "Each party can post on their own channels. Tag + credit required." },
];

export default function NewCollab() {
  const router = useRouter();

  const [recipientHandle, setRecipientHandle] = useState("");
  const [title, setTitle] = useState("Collab Proposal");
  const [message, setMessage] = useState("");
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [state, setState] = useState({ loading: false, error: null });

  async function create() {
    setState({ loading: true, error: null });
    try {
      const r = await fetch("/api/collabs/proposals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientHandle, title, message, terms }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || j.error || "failed");
      router.push(`/collabs/p/${j.proposalId}`);
    } catch (e) {
      setState({ loading: false, error: e.message || "error" });
      return;
    }
  }

  function updateTerm(i, patch) {
    setTerms((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function addTerm() {
    setTerms((prev) => [...prev, { key: "term", label: "New Term", value: "" }]);
  }

  function removeTerm(i) {
    setTerms((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">New Proposal</h1>
            <p className="text-white/60 text-sm">Recipient = handle. Keep it moving.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
              <label className="text-xs text-white/60">Recipient handle</label>
              <input
                value={recipientHandle}
                onChange={(e) => setRecipientHandle(e.target.value.trim())}
                placeholder="e.g. sexworkceo"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
              />
              <p className="mt-2 text-xs text-white/40">This must match their `User.handle`.</p>
            </div>

            <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
              <label className="text-xs text-white/60">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
              />
            </div>
          </div>

          <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
            <label className="text-xs text-white/60">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What are you proposing? What’s the vibe? What do you need?"
              className="mt-2 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
            />
          </div>

          <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Terms</div>
                <div className="text-xs text-white/60">Each term can be countered/accepted/commented.</div>
              </div>
              <button
                onClick={addTerm}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
              >
                + Add Term
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {terms.map((t, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-white/60">Key</label>
                      <input
                        value={t.key}
                        onChange={(e) => updateTerm(i, { key: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-white/60">Label</label>
                      <input
                        value={t.label}
                        onChange={(e) => updateTerm(i, { label: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-white/60">Value</label>
                    <textarea
                      value={t.value}
                      onChange={(e) => updateTerm(i, { value: e.target.value })}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => removeTerm(i)}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {state.error && <div className="text-red-400">Error: {state.error}</div>}

          <button
            onClick={create}
            disabled={state.loading || !recipientHandle}
            className="px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:opacity-50"
          >
            {state.loading ? "Creating…" : "Create Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
