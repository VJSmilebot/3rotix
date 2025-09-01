'use client';
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Player } from '@livepeer/react';
import OverlayLayer from '../../components/OverlayLayer';
import { supabase } from '../../lib/supabaseClient';

export default function Watch() {
  const router = useRouter();
  const { query, isReady } = router;
  const playbackId = (query?.id || query?.playbackId || '').toString();

  const [isActive, setIsActive] = useState(false);
  const [theater, setTheater] = useState(false);
  const [rtt, setRtt] = useState(null);

  // Overlay defaults (live-updated via realtime)
  const [overlayConfig, setOverlayConfig] = useState({
    position: 'br', size: 'standard', opacity: 0.9, marginPx: 24,
  });

  // Presence: count viewers
  useEffect(() => {
    if (!isReady || !playbackId) return;
    const key =
      (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
      `anon-${Math.random().toString(36).slice(2)}`;

    const ch = supabase.channel(`presence:watch:${playbackId}`, {
      config: { presence: { key } },
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ joinedAt: Date.now() });
    });
    return () => { try { ch.unsubscribe(); } catch {} };
  }, [isReady, playbackId]);

  // Poll live status
  useEffect(() => {
    let timer;
    const poll = async () => {
      if (!playbackId) return;
      try {
        const res = await fetch(`/api/livepeer/status?playbackId=${encodeURIComponent(playbackId)}`);
        const data = await res.json();
        setIsActive(!!data?.isActive);
      } catch {
        setIsActive(false);
      } finally {
        timer = setTimeout(poll, 5000);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [playbackId]);

  // Realtime overlay sync
  useEffect(() => {
    if (!isReady || !playbackId) return;
    const ch = supabase.channel(`overlay:${playbackId}`);
    ch.on('broadcast', { event: 'overlay' }, (payload) => {
      setOverlayConfig((c) => ({ ...c, ...(payload?.payload || {}) }));
    });
    ch.subscribe();
    return () => { try { ch.unsubscribe(); } catch {} };
  }, [isReady, playbackId]);

  // Show a tiny RTT label
  useEffect(() => {
    const c = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    const update = () => setRtt(c?.rtt || null);
    update();
    c?.addEventListener?.('change', update);
    return () => c?.removeEventListener?.('change', update);
  }, []);

  const containerClass = useMemo(
    () => `mx-auto ${theater ? 'max-w-[100vw]' : 'max-w-5xl'} transition-[max-width] duration-300`,
    [theater]
  );

  const reportHref = useMemo(() => {
    const subject = encodeURIComponent('Stream issue report');
    const body = encodeURIComponent(`PlaybackID: ${playbackId}\nStatus: ${isActive ? 'Live' : 'Offline'}\nNotes: `);
    return `mailto:support@3rotix.com?subject=${subject}&body=${body}`;
  }, [playbackId, isActive]);

  return (
    <>
      <Head>
        <title>Watch — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        <section className={`${containerClass} px-4 py-8`}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Live Stream</h1>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${isActive ? 'border-red-500 bg-red-500/10' : 'border-white/15 bg-white/5'}`}>
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
                {isActive ? 'LIVE' : 'OFFLINE'}
              </span>
              <button
                onClick={() => setTheater(t => !t)}
                className="rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs focus:ring-2 focus:ring-pink-500"
                aria-pressed={theater}
                aria-label="Toggle theater mode"
              >
                {theater ? 'Exit Theater' : 'Theater Mode'}
              </button>
            </div>
          </div>

          {!isReady || !playbackId ? (
            <div className="aspect-video grid place-items-center rounded-2xl border border-white/10 bg-white/5">
              Loading player…
            </div>
          ) : (
            <>
              {/* Player + overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                {isActive ? (
                  <Player
                    title="3ROTIX Live"
                    playbackId={playbackId}
                    autoPlay
                    muted
                    showPipButton
                    showTitle={false}
                    aspectRatio="16to9"
                  />
                ) : (
                  <div className="aspect-video grid place-items-center">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold">Stream is offline</div>
                      <div className="text-white/70">If this just went live, it may take a moment to appear.</div>
                    </div>
                  </div>
                )}

                {/* Overlay always on top */}
                <div className="absolute inset-0 pointer-events-none">
                  <OverlayLayer config={overlayConfig} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  Network RTT: {rtt ? `${rtt} ms` : '—'}
                </span>
                <a
                  href={reportHref}
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 underline decoration-pink-500"
                  target="_blank" rel="noopener noreferrer"
                >
                  Report an issue
                </a>
                <a
                  href={`https://lvpr.tv/?v=${playbackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 underline decoration-pink-500"
                >
                  Open in Livepeer
                </a>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
