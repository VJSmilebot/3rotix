// components/TipButtons.jsx

import { useState } from "react";

async function logSupportIntent(creatorId, method) {
  try {
    await fetch("/api/support-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, method }),
    });
  } catch (err) {
    console.error("Failed to log support intent:", err);
  }
}

export default function TipButtons({ creator }) {
  const [showPanel, setShowPanel] = useState(false);

  if (
    !creator?.cashappTag &&
    !creator?.venmoHandle &&
    !creator?.paypalLink &&
    !creator?.kofiLink &&
    !creator?.cryptoAddress
  ) {
    return null; // nothing to show
  }

  const handleClick = (method, url) => {
    if (!url) return;
    logSupportIntent(creator.id, method);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const cashAppUrl = creator.cashappTag
    ? `https://cash.app/$${creator.cashappTag.replace(/^\$/, "")}`
    : null;

  const venmoUrl = creator.venmoHandle
    ? `https://venmo.com/${creator.venmoHandle.replace(/^@/, "")}`
    : null;

  const paypalUrl = creator.paypalLink || null;
  const kofiUrl = creator.kofiLink || null;
  const cryptoAddress = creator.cryptoAddress || null;

  return (
    <div className="mt-4">
      {/* Main button */}
      <button
        type="button"
        onClick={() => setShowPanel((prev) => !prev)}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500 transition shadow-lg shadow-pink-500/30"
      >
        <span className="mr-2">💗</span>
        <span>Support this creator</span>
      </button>

      {showPanel && (
        <div className="mt-3 rounded-2xl border border-pink-500/30 bg-zinc-900/90 p-3 sm:p-4 backdrop-blur">
          <p className="text-xs sm:text-sm text-zinc-300 mb-2">
            Choose how you want to send a tip. Payments go directly to the
            creator using their existing accounts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cashAppUrl && (
              <button
                type="button"
                onClick={() => handleClick("cashapp", cashAppUrl)}
                className="flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-emerald-500/50"
              >
                💸 Cash App
              </button>
            )}

            {venmoUrl && (
              <button
                type="button"
                onClick={() => handleClick("venmo", venmoUrl)}
                className="flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-sky-500/50"
              >
                📲 Venmo
              </button>
            )}

            {paypalUrl && (
              <button
                type="button"
                onClick={() => handleClick("paypal", paypalUrl)}
                className="flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-blue-500/50"
              >
                🔗 PayPal
              </button>
            )}

            {kofiUrl && (
              <button
                type="button"
                onClick={() => handleClick("kofi", kofiUrl)}
                className="flex items-center justify-center rounded-full px-3 py-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-amber-400/60"
              >
                ☕ Ko-fi
              </button>
            )}
          </div>

          {cryptoAddress && (
            <div className="mt-3 border-t border-zinc-700 pt-2">
              <p className="text-xs text-zinc-400 mb-1">
                Prefer crypto? Send to:
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[10px] sm:text-xs text-zinc-200 break-all bg-zinc-950/80 px-2 py-1 rounded">
                  {cryptoAddress}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(cryptoAddress);
                    } catch (e) {
                      console.error("Clipboard error:", e);
                    }
                  }}
                  className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] text-zinc-500">
            3ROTIX doesn&apos;t process these payments yet — we just connect you
            to the creator&apos;s own tip links.
          </p>
        </div>
      )}
    </div>
  );
}
