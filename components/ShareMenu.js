'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function ShareMenu({ title='3ROTIX Live', url, playbackId, utm='live' }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef(null);

  const shareUrl = addUtm(url, { source: 'share', medium: 'creator', campaign: `${utm}_${new Date().toISOString().slice(0,10)}` });

  useEffect(() => {
    if (!open || !canvasRef.current || !shareUrl) return;
    QRCode.toCanvas(canvasRef.current, shareUrl, { margin: 1, width: 192 }).catch(()=>{});
  }, [open, shareUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied.');
    } catch {}
  };

  const socials = [
    { name: 'X/Twitter', base: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(`${title}\n${shareUrl}`) },
    { name: 'Telegram', base: 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(title) },
    { name: 'Reddit', base: 'https://www.reddit.com/submit?url=' + encodeURIComponent(shareUrl) + '&title=' + encodeURIComponent(title) },
    { name: 'WhatsApp', base: 'https://api.whatsapp.com/send?text=' + encodeURIComponent(`${title} ${shareUrl}`) },
    { name: 'Email', base: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm focus:ring-2 focus:ring-pink-500"
      >
        Share
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-white/10 bg-[#101014] p-4 shadow-xl">
          <div className="text-sm font-medium mb-2">Share your stream</div>
          <div className="grid grid-cols-[1fr_auto] gap-2 mb-2">
            <input className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-xs" value={shareUrl} readOnly />
            <button onClick={copy} className="rounded px-3 py-2 bg-pink-600 text-white text-xs">Copy</button>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {socials.map(s => (
              <a key={s.name} href={s.base} target="_blank" rel="noopener noreferrer"
                 className="rounded px-2 py-1 bg-white/10 hover:bg-white/20 text-xs underline decoration-pink-500">
                {s.name}
              </a>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <canvas ref={canvasRef} width={192} height={192} />
          </div>
        </div>
      )}
    </div>
  );
}

function addUtm(url, { source, medium, campaign }) {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'https://example.com');
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', medium);
    u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch { return url; }
}
