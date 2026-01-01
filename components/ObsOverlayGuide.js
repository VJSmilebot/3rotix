'use client';
import CopyField from './CopyField';

export default function ObsOverlayGuide({ overlayId='stream', domain='', width=1920, height=1080 }) {
  const url = `${domain}/overlay/${overlayId}?w=${width}&h=${height}&pos=br&size=standard&opacity=0.9&margin=24`;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h3 className="font-semibold">OBS Overlay (Browser Source)</h3>
      <CopyField label="Overlay URL" value={url} />
      <div className="grid grid-cols-2 gap-3">
        <CopyField label="Width" value={String(width)} />
        <CopyField label="Height" value={String(height)} />
      </div>
      <ol className="text-sm text-white/80 list-decimal ml-5 space-y-1">
        <li>OBS → Sources → <em>+</em> → Browser.</li>
        <li>Paste Overlay URL. Set Width/Height to your canvas (e.g., 1920×1080).</li>
        <li>Check “Transparent background”.</li>
        <li>Place above your video source. Done.</li>
      </ol>
      <p className="text-xs text-white/50">
        (YouTube: overlays require OBS/encoder—YouTube itself can’t add custom HTML overlays.)
      </p>
    </div>
  );
}
