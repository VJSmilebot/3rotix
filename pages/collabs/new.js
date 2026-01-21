// pages/collabs/new.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function CollabNew() {
  const router = useRouter();

  const [recipientHandle, setRecipientHandle] = useState("");
  const [title, setTitle] = useState("Collab Proposal");
  const [note, setNote] = useState("");
  const [terms, setTerms] = useState([
    { key: "", value: { text: "" }, isRequired: true },
  ]);
  const [state, setState] = useState({ loading: false, error: null });

  function updateTerm(i, patch) {
    setTerms((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function addTerm() {
    setTerms((prev) => [...prev, { key: "", value: { text: "" }, isRequired: true }]);
  }

  function removeTerm(i) {
    setTerms((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function create() {
    setState({ loading: true, error: null });
    try {
      const r = await fetch("/api/collabs/proposals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientHandle,
          title,
          note,
          terms: terms
            .filter((t) => t.key)
            .map((t) => ({ key: t.key, value: t.value, isRequired: !!t.isRequired })),
        }),
      });
      const j = await r.json();
      console.log("create response:", j);
      if (!j.ok) throw new Error(j.message || j.error || "failed");
      if (!j.proposalId) throw new Error("No proposalId returned from API");
      router.push(`/collabs/p/${j.proposalId}`);
    } catch (e) {
      setState({ loading: false, error: e.message || "error" });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">New Proposal</h1>
        <p className="text-white/60 text-sm mt-1">
          Recipient = handle. Term key must match <span className="text-white">CollabTermKey</span> enum.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
              <label className="text-xs text-white/60">Recipient handle</label>
              <input
                value={recipientHandle}
               onChange={(e) =>
                 setRecipientHandle(
                   e.target.value.trim().replace(/^@/, "").toLowerCase()
              )
          }
                placeholder="e.g. creatorhandle"
                className="mt-2 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
              />
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
            <label className="text-xs text-white/60">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Short pitch + expectations."
              className="mt-2 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
            />
          </div>

          <div className="border border-white/10 rounded-2xl p-5 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Terms</div>
                <div className="text-xs text-white/60">Each term value stored as JSON (CollabTermVersion.valueJson).</div>
              </div>
              <button onClick={addTerm} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
                + Add Term
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {terms.map((t, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-white/60">Key</label>
                      <select
                        value={t.key}
                        onChange={(e) => updateTerm(i, { key: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
                      >
                        <option value="">Select…</option>
                        {[
                          "DELIVERABLES",
                          "SCHEDULE",
                          "PLATFORMS",
                          "SPLIT_PAYOUT",
                          "RIGHTS",
                          "PROMO",
                          "SAFETY",
                          "FILES",
                        ].map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-white/60">Value (text)</label>
                      <input
                        value={t.value?.text || ""}
                        onChange={(e) => updateTerm(i, { value: { text: e.target.value } })}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label className="text-xs text-white/60 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!t.isRequired}
                        onChange={(e) => updateTerm(i, { isRequired: e.target.checked })}
                      />
                      required
                    </label>

                    <button onClick={() => removeTerm(i)} className="text-xs text-red-300 hover:text-red-200">
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
