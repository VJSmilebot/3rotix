// pages/studio/vault.js
import { useEffect, useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortenHash(hash) {
  if (!hash) return "-";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

export default function VaultPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVault() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/vault/list");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "Failed to load vault");
        }

        if (!cancelled) {
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("[VaultPage] load error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load vault");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVault();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Content Vault
            </h1>
            <p className="mt-1 text-sm text-gray-400 max-w-xl">
              These are your registered works. Each item is fingerprinted and
              timestamped to help you prove ownership and fight leaks.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300 border border-emerald-500/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Registered &amp; Protected
            </span>
          </div>
        </header>

        {loading && (
          <div className="mt-16 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-800 bg-zinc-950 px-4 py-2 text-xs text-gray-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pink-500" />
              Loading your vault…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-xl border border-red-700/60 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-800 bg-zinc-950 px-6 py-10 text-center">
            <p className="text-sm text-gray-300">
              Nothing in your vault yet.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Use <span className="font-semibold text-pink-400">
                “Register in Vault”
              </span>{" "}
              on any uploaded video in your Studio to add your first work.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-4 grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const primaryFingerprint =
                item.fingerprints && item.fingerprints[0];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-zinc-950 text-left shadow-sm hover:border-pink-500/70 hover:shadow-pink-500/20 transition-colors"
                >
                  {item.video?.thumbnailUrl ? (
                    <div className="relative h-32 w-full overflow-hidden">
                      <img
                        src={item.video.thumbnailUrl}
                        alt={item.title || item.video.title || "Registered work"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="relative h-32 w-full bg-gradient-to-br from-pink-600/30 via-fuchsia-700/20 to-indigo-500/40">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_20%,#ec4899_0,transparent_40%),radial-gradient(circle_at_80%_0,#a855f7_0,transparent_40%),radial-gradient(circle_at_50%_100%,#22c55e_0,transparent_45%)]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>
                  )}

                  <div className="relative p-3.5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                            Registered
                          </span>
                          {item.video?.visibility === "private" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-800/80 px-1.5 py-0.5 text-[10px] text-gray-300 border border-gray-700">
                              Private
                            </span>
                          )}
                        </div>
                        <h2 className="truncate text-sm font-semibold text-white">
                          {item.title || item.video?.title || "Untitled work"}
                        </h2>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(item.registeredAt)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-col gap-1 text-[11px] text-gray-400">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">Hash</span>
                        <span className="font-mono text-[10px] text-gray-200">
                          {primaryFingerprint
                            ? shortenHash(primaryFingerprint.value)
                            : "—"}
                        </span>
                      </div>
                      {item.video && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-500">Video</span>
                          <span className="truncate text-[10px] text-gray-300">
                            {item.video.title || item.video.id}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <VaultDetailsModal item={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function VaultDetailsModal({ item, onClose }) {
  const primaryFingerprint = item.fingerprints?.[0];

  const fullHash = primaryFingerprint?.value || "";
  const hashPreview = shortenHash(fullHash);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullHash);
    } catch (err) {
      console.error("copy failed", err);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-zinc-950 p-4 md:p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {item.title || item.video?.title || "Registered work"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Registered on {formatDate(item.registeredAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/40 px-2 py-1 text-xs text-gray-400 hover:text-gray-100 hover:bg-black/70"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-gray-300">
          <div>
            <div className="mb-1 font-semibold text-gray-200">Status</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 border border-emerald-500/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {item.status || "ACTIVE"}
            </div>
          </div>

          <div>
            <div className="mb-1 font-semibold text-gray-200">
              Primary fingerprint
            </div>
            {fullHash ? (
              <div className="rounded-lg border border-gray-800 bg-black/60 px-3 py-2 font-mono text-[11px] text-gray-100 break-all">
                {fullHash}
              </div>
            ) : (
              <div className="text-gray-500">No fingerprint recorded.</div>
            )}
            {fullHash && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                <span>Short preview: {hashPreview}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] text-gray-200 hover:border-pink-500 hover:text-pink-300"
                >
                  Copy full hash
                </button>
              </div>
            )}
          </div>

          {item.video && (
            <div>
              <div className="mb-1 font-semibold text-gray-200">Linked video</div>
              <div className="rounded-lg border border-gray-800 bg-black/60 px-3 py-2">
                <div className="text-[11px] text-gray-100">
                  {item.video.title || item.video.id}
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500">
                  ID: {item.video.id}
                </div>
                {item.video.visibility && (
                  <div className="mt-0.5 text-[10px] text-gray-500">
                    Visibility: {item.video.visibility}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-[10px] text-gray-500">
          This record is part of your 3ROTIX Vault. Use the fingerprint and
          timestamp as proof of ownership when disputing leaks or unauthorized use.
        </p>
      </div>
    </div>
  );
}
