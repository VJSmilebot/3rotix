// components/CreatorOnboardingChecklist.jsx
import { useEffect, useMemo, useState } from "react";

function statusPill(status) {
  if (status === "COMPLETE") return "bg-green-500/15 border-green-400/30 text-green-200";
  if (status === "NEEDS_REVIEW") return "bg-yellow-500/15 border-yellow-400/30 text-yellow-200";
  if (status === "WAIVED") return "bg-white/10 border-white/15 text-white/70";
  return "bg-white/5 border-white/10 text-white/60";
}

export default function CreatorOnboardingChecklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  // You should already have a way to get the Supabase access token client-side.
  // This component assumes you store it somewhere accessible; adapt as needed.
  async function getAccessToken() {
    // Example: if you have supabase client available globally, replace this.
    // return (await supabase.auth.getSession())?.data?.session?.access_token;
    return window.__sbAccessToken || null;
  }

  async function api(path, opts = {}) {
    const token = await getAccessToken();
    if (!token) throw new Error("Missing session token");
    const res = await fetch(path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      // run auto-eval first so it “updates automatically”
      await api("/api/onboarding/evaluate", { method: "POST", body: JSON.stringify({}) }).catch(() => {});
      const data = await api("/api/onboarding/steps");
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((x) => (x.progress?.status || "PENDING") === "COMPLETE").length;
    const review = items.filter((x) => (x.progress?.status || "PENDING") === "NEEDS_REVIEW").length;
    return { total, done, review };
  }, [items]);

  async function completeStep(stepId) {
    setBusyId(stepId);
    setError(null);
    try {
      await api(`/api/onboarding/steps/${stepId}/complete`, {
        method: "POST",
        body: JSON.stringify({ notes: "Self-attested" }),
      });
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="p-4 md:p-6 rounded-2xl bg-black/60 border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl md:text-2xl font-semibold text-white">Creator Onboarding</div>
            <div className="text-sm text-white/60 mt-1">
              Knock these out once. The platform tracks it. Compliance stays clean.
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70">
              <span className="text-white">{stats.done}</span> / {stats.total} complete
            </div>
            {stats.review > 0 && (
              <div className="text-xs text-yellow-200/80 mt-1">{stats.review} waiting review</div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 text-white/60 text-sm">Loading checklist…</div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map(({ step, progress }) => {
              const status = progress?.status || "PENDING";
              const canSelf = step.allowSelfAttest === true;
              const locked = busyId === step.id;

              return (
                <div key={step.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-white font-semibold">{step.title}</div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusPill(status)}`}>
                          {status}
                        </span>
                        {progress?.autoDetected && (
                          <span className="text-xs px-2 py-1 rounded-full border bg-pink-500/10 border-pink-400/20 text-pink-200/80">
                            auto
                          </span>
                        )}
                        {progress?.selfAttested && (
                          <span className="text-xs px-2 py-1 rounded-full border bg-white/5 border-white/10 text-white/60">
                            self
                          </span>
                        )}
                      </div>
                      {step.description && <div className="text-sm text-white/60 mt-1">{step.description}</div>}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {status === "PENDING" && canSelf && (
                        <button
                          disabled={locked}
                          onClick={() => completeStep(step.id)}
                          className="px-3 py-2 rounded-xl bg-pink-500 text-black font-semibold disabled:opacity-60"
                        >
                          {locked ? "…" : "Mark done"}
                        </button>
                      )}
                      {status === "PENDING" && !canSelf && (
                        <div className="text-xs text-white/50">Auto / admin only</div>
                      )}
                    </div>
                  </div>

                  {step.evidenceHint && (
                    <div className="mt-2 text-xs text-white/45">
                      Proof hint: <span className="text-white/60">{step.evidenceHint}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
