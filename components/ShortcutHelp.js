'use client';
export default function ShortcutHelp({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101014] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500"
            aria-label="Close shortcuts help"
          >
            ✕
          </button>
        </div>
        <ul className="text-sm space-y-2">
          <li><span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">S</span> — Start / Stop</li>
          <li><span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">M</span> — Mute / Unmute Mic</li>
          <li><span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">?</span> — Open this help</li>
        </ul>
        <p className="text-xs text-white/50 mt-3">Shortcuts work when the Go Live page is focused.</p>
      </div>
    </div>
  );
}
