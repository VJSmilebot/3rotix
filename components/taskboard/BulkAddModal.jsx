import { useMemo, useState } from "react";

function safeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * Turns pasted text into items.
 * - Splits on newlines
 * - Trims bullets like "-", "•", "*" at the start
 * - Optional "name — source" parsing
 * - De-dupes against existing texts (case-insensitive)
 */
export function parseBulkLines(text, existingItems = []) {
  const existing = new Set(
    (existingItems || [])
      .map((i) => (i?.text || i?.title || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .map((l) => l.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (existing.has(lower)) continue; // de-dupe
    existing.add(lower);

    // Smart parse: "name — source" or "name - source"
    const m = line.match(/^(.+?)\s*(?:—|--|-)\s*(.+)$/);
    const textValue = m ? m[1].trim() : line;
    const source = m ? m[2].trim() : "";

    items.push({
      id: safeId(),
      text: textValue,
      done: false,
      notes: source ? `Source: ${source}` : "",
      createdAt: new Date().toISOString(),
    });
  }

  return items;
}

export default function BulkAddModal({
  open,
  onClose,
  onConfirm,
  existingItems = [],
  title = "Bulk Add Items",
}) {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => parseBulkLines(raw, existingItems), [raw, existingItems]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 grid place-items-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-black/70 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-100">{title}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Paste one item per line. Supports <span className="text-gray-200">name — source</span>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300">Paste lines</label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"pootieXXX — FetLife\npolyannie — Twitter\n..."}
              className="mt-2 w-full min-h-[220px] rounded-xl border border-gray-800 bg-black/60 p-3 text-sm text-gray-100 outline-none focus:border-pink-500"
            />
            <div className="mt-2 text-[11px] text-gray-500">
              Deduping is on. Empty lines are ignored.
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300">Preview</label>
            <div className="mt-2 min-h-[220px] rounded-xl border border-gray-800 bg-black/40 p-3">
              {parsed.length === 0 ? (
                <div className="text-sm text-gray-500">Nothing to add yet.</div>
              ) : (
                <ul className="space-y-2">
                  {parsed.slice(0, 12).map((it) => (
                    <li key={it.id} className="rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2">
                      <div className="text-sm text-gray-100">{it.text}</div>
                      {it.notes ? <div className="text-[11px] text-gray-400 mt-0.5">{it.notes}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
              {parsed.length > 12 ? (
                <div className="text-[11px] text-gray-500 mt-2">
                  + {parsed.length - 12} more…
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-300">
            Will add: <span className="text-pink-400 font-semibold">{parsed.length}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              disabled={parsed.length === 0}
              onClick={() => {
                onConfirm(parsed);
                setRaw("");
                onClose();
              }}
              className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
            >
              Add Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
