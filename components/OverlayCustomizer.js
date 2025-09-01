'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function OverlayCustomizer({
  open,
  onClose,
  playbackId,          // required for publish
  config, setConfig,
  canToggleWatermark = false,  // entitlement (false = locked)
}) {
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onEsc);
    // lazy channel setup
    if (!channelRef.current && playbackId) {
      channelRef.current = supabase.channel(`overlay:${playbackId}`);
      channelRef.current.subscribe();
    }
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose, playbackId]);

  const update = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const onUploadLogo = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      // Simple inline base64 (good enough for small logos)
      const b64 = await fileToBase64(file);
      update({ logoUrl: b64 });
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (!playbackId) return;
    setPublishing(true);
    try {
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'overlay',
        payload: config,
      });
      // tiny toast
      alert('Overlay pushed live.');
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101014] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Overlay Customizer</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500"
            aria-label="Close overlay customizer"
          >
            ✕
          </button>
        </div>

        {/* Locked watermark toggle */}
        <div className="mb-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-white/90">3ROTIX watermark</span>
            <input type="checkbox" checked readOnly disabled className="h-4 w-4 accent-pink-600" />
          </label>
          {!canToggleWatermark && (
            <p className="text-xs text-white/50 mt-1">
              Locked — included on all streams.{' '}
              <a href="/pricing" target="_blank" rel="noopener noreferrer" className="underline decoration-pink-500">
                Upgrade to remove
              </a>.
            </p>
          )}
        </div>

        {/* Position */}
        <div className="mb-4">
          <div className="text-sm text-white/80 mb-1">Watermark Position</div>
          <div className="grid grid-cols-4 gap-2">
            {['tl','tr','bl','br'].map((p) => (
              <button
                key={p}
                onClick={() => update({ position: p })}
                aria-pressed={config?.position === p}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  config?.position === p ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="mb-4">
          <div className="text-sm text-white/80 mb-1">Watermark Size</div>
          <div className="flex gap-2">
            {['compact','standard','bold'].map((s) => (
              <button
                key={s}
                onClick={() => update({ size: s })}
                aria-pressed={config?.size === s}
                className={`rounded-lg px-3 py-2 text-sm border capitalize ${
                  config?.size === s ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1">
            Opacity <span className="text-white/50">({Math.round((config?.opacity ?? 0.9) * 100)}%)</span>
          </label>
          <input
            type="range"
            min={40}
            max={100}
            value={Math.round((config?.opacity ?? 0.9) * 100)}
            onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-pink-600"
          />
        </div>

        {/* Margin */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1">
            Safe-area margin <span className="text-white/50">({config?.marginPx ?? 24}px)</span>
          </label>
          <input
            type="range"
            min={8}
            max={64}
            value={config?.marginPx ?? 24}
            onChange={(e) => update({ marginPx: Number(e.target.value) })}
            className="w-full accent-pink-600"
          />
        </div>

        {/* Logo upload */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1">Add secondary logo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUploadLogo(e.target.files?.[0])}
            className="block w-full text-sm"
            disabled={uploading}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-white/80">Logo size (px)
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 mt-1"
                     value={config?.logoSize ?? 120}
                     onChange={(e) => update({ logoSize: Number(e.target.value) })}/>
            </label>
            <label className="text-xs text-white/80">Logo corner
              <select className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 mt-1"
                      value={config?.logoPosition ?? 'tl'}
                      onChange={(e)=>update({ logoPosition: e.target.value })}>
                {['tl','tr','bl','br'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Lower-third */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1">Lower-third text (optional)</label>
          <input
            type="text"
            value={config?.lowerText ?? ''}
            onChange={(e)=>update({ lowerText: e.target.value })}
            className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
            placeholder="@creator • linktr.ee/you"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="text-xs text-white/80">Text color
              <input type="color" className="w-full h-9 bg-white/5 border border-white/10 rounded mt-1"
                     value={config?.lowerColor ?? '#ffffff'}
                     onChange={(e)=>update({ lowerColor: e.target.value })}/>
            </label>
            <label className="text-xs text-white/80">Background
              <input type="color" className="w-full h-9 bg-white/5 border border-white/10 rounded mt-1"
                     value={rgbaToHex(config?.lowerBg ?? 'rgba(0,0,0,0.35)')}
                     onChange={(e)=>update({ lowerBg: hexToRgba(e.target.value, 0.35) })}/>
            </label>
          </div>
          <div className="mt-2">
            <label className="text-xs text-white/80">Lower-third corner</label>
            <select className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 mt-1"
                    value={config?.lowerPos ?? 'bl'}
                    onChange={(e)=>update({ lowerPos: e.target.value })}>
              {['tl','tr','bl','br'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <button
            onClick={publish}
            disabled={publishing || !playbackId}
            className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-500 focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
          >
            {publishing ? 'Publishing…' : 'Publish to viewers'}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

async function fileToBase64(file) {
  const reader = new FileReader();
  return await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// helpers
function rgbaToHex(rgba) {
  // expects 'rgba(r,g,b,a)'
  try {
    const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return '#000000';
    const r = (+m[1]).toString(16).padStart(2,'0');
    const g = (+m[2]).toString(16).padStart(2,'0');
    const b = (+m[3]).toString(16).padStart(2,'0');
    return `#${r}${g}${b}`;
  } catch { return '#000000'; }
}
function hexToRgba(hex, a=1) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
