<<<<<<< HEAD
export default function Placeholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1>🚧 This page is under construction 🚧</h1>
    </div>
=======
// pages/streaming.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import * as Broadcast from '@livepeer/react/broadcast';
import { getIngest } from '@livepeer/react';

import CopyField from '../components/CopyField';
import DeviceCheckModal from '../components/DeviceCheckModal';
import ShortcutHelp from '../components/ShortcutHelp';
import OverlayLayer from '../components/OverlayLayer';
import OverlayCustomizer from '../components/OverlayCustomizer';
import ObsOverlayGuide from '../components/ObsOverlayGuide';
import ShareMenu from '../components/ShareMenu';
import ChatControls from '../components/ChatControls';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';

const accent = 'from-pink-600 to-purple-500';

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600).toString().padStart(2, '0');
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return hh === '00' ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

export default function Streaming() {
  // -------- Auth + role gate --------
  const { user, loading } = useAuth() ?? {};
  const [canBroadcast, setCanBroadcast] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setRoleChecked(true); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = (profile?.role || user.user_metadata?.role || 'fan').toLowerCase();
      const plan = (profile?.plan_tier || '').toLowerCase();
      const allowed =
        !!profile?.is_creator ||
        role === 'creator' ||
        role === 'admin' ||
        ['pro', 'creator', 'vip'].includes(plan);

      if (!cancelled) { setCanBroadcast(!!allowed); setRoleChecked(true); }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // -------- Create stream form --------
  const [title, setTitle] = useState('Going live on 3ROTIX');
  const [record, setRecord] = useState(true);
  const [nsfw, setNsfw] = useState(true);

  // Stream object returned from API
  const [creating, setCreating] = useState(false);
  const [stream, setStream] = useState(null);

  // Modals
  const [showDeviceCheck, setShowDeviceCheck] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Overlay state
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayConfig, setOverlayConfig] = useState({
    position: 'br',
    size: 'standard',
    opacity: 0.9,
    marginPx: 24,
    logoUrl: '',
    logoSize: 120,
    logoPosition: 'tl',
    lowerText: '',
    lowerColor: '#ffffff',
    lowerBg: 'rgba(0,0,0,0.35)',
    lowerPos: 'bl',
  });

  // Live preview UI
  const [isLive, setIsLive] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [viewerCount, setViewerCount] = useState(0);

  // Hotkey refs
  const startRef = useRef(null);
  const stopRef = useRef(null);
  const micRef = useRef(null);

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const watchUrl = stream?.playbackId ? `/watch/${stream.playbackId}` : '';
  const lvprUrl  = stream?.playbackId ? `https://lvpr.tv/?v=${stream.playbackId}` : '';

  // ✅ Derive WHIP ingest URL (handles older SDKs with fallback)
  const ingestUrl = useMemo(() => {
    if (!stream) return null;
    if (stream.webrtcIngestUrl) return stream.webrtcIngestUrl;
    if (stream.streamKey) {
      try {
        return getIngest(stream.streamKey, { baseUrl: 'https://playback.livepeer.studio/webrtc' });
      } catch {
        return `https://playback.livepeer.studio/webrtc/${stream.streamKey}`;
      }
    }
    return null;
  }, [stream]);

  const shareBundle = useMemo(() => {
    if (!stream) return '';
    const lines = [
      nsfw ? '[NSFW]' : '[SFW]',
      `Title: ${title}`,
      `Watch (site): ${siteOrigin}${watchUrl}`,
      `Watch (Livepeer): ${lvprUrl}`,
      `RTMP URL: rtmp://rtmp.livepeer.com/live`,
      `Stream Key: ${stream.streamKey || ''}`,
      record ? 'VOD: Recording enabled' : 'VOD: Not recording',
    ];
    return lines.join('\n');
  }, [stream, title, record, nsfw, watchUrl, lvprUrl, siteOrigin]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(shareBundle);
      alert('Copied stream details to clipboard.');
    } catch {
      alert('Copy failed. Select and copy manually.');
    }
  }

  async function createStream(e) {
    e?.preventDefault();
    setCreating(true);
    try {
      // Include Supabase access token in Authorization header (no auth-helpers needed)
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;

      const res = await fetch('/api/livepeer/create-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ name: title, record, nsfw }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create stream');

      // Normalize expected fields just in case
      const normalized = {
        id: data.id,
        playbackId: data.playbackId,
        streamKey: data.streamKey,
        // These can be derived; we keep them if the API gave them
        rtmpIngestUrl: data.rtmpIngestUrl || 'rtmp://rtmp.livepeer.com/live',
        webrtcIngestUrl:
          data.webrtcIngestUrl ||
          (data.streamKey ? `https://playback.livepeer.studio/webrtc/${data.streamKey}` : null),
      };

      setStream(normalized);
    } catch (err) {
      alert(err.message || 'Failed to create stream.');
    } finally {
      setCreating(false);
    }
  }

  // Hotkeys
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 's' || e.key === 'S') {
        if (!isLive) startRef.current?.click(); else stopRef.current?.click();
      } else if (e.key === 'm' || e.key === 'M') {
        micRef.current?.click();
      } else if (e.key === '?') {
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLive]);

  // Live timer
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  // Presence: viewer count from /watch page
  useEffect(() => {
    const pid = stream?.playbackId;
    if (!pid) return;
    const ch = supabase.channel(`presence:watch:${pid}`, {
      config: { presence: { key: `host-${pid}` } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      let total = 0;
      Object.values(state).forEach((arr) => (total += Array.isArray(arr) ? arr.length : 0));
      setViewerCount(total);
    });
    ch.subscribe();
    return () => { try { ch.unsubscribe(); } catch {} };
  }, [stream?.playbackId]);

  return (
    <>
      <Head>
        <title>Go Live — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Go <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Live</span>
          </h1>
          <p className="text-white/70 mt-2">
            One-click browser streaming (ultra-low latency WebRTC) or use OBS with RTMP. Replays can be recorded if enabled.
          </p>

          {/* --- UI Gate blocks --- */}
          {(loading || !roleChecked) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-white/80">Checking your creator access…</div>
            </div>
          )}

          {!loading && roleChecked && !user && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-white/80 mb-2">You must be logged in to go live.</div>
              <a href="/login?next=/streaming" className="inline-block rounded-lg px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-500">
                Log in
              </a>
            </div>
          )}

          {!loading && roleChecked && user && !canBroadcast && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-white/90 font-medium">Creator access required</div>
              <p className="text-white/70 mt-1">Only approved creators can start a stream.</p>
              <div className="mt-3 flex gap-2">
                <a href="/creator-portal" className="rounded-lg px-4 py-2 bg-white/10 hover:bg-white/20">Apply to be a creator</a>
                <a href="/pricing" className="rounded-lg px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-500">Upgrade</a>
              </div>
            </div>
          )}
          {/* --- /UI Gate blocks --- */}

          {/* Render streaming UI only for allowed creators */}
          {user && canBroadcast && (
            <>
              {!stream && (
                <form onSubmit={createStream} className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 md:p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-white/80 mb-1">Stream title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="My first 3ROTIX stream"
                        aria-label="Stream title"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm text-white/90 cursor-pointer">
                        <input id="record" type="checkbox" checked={record} onChange={(e)=>setRecord(e.target.checked)} className="h-5 w-5 accent-pink-600" />
                        Record VOD
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-white/90 cursor-pointer">
                        <input id="nsfw" type="checkbox" checked={nsfw} onChange={(e)=>setNsfw(e.target.checked)} className="h-5 w-5 accent-pink-600" />
                        Mark NSFW
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" disabled={creating} className="rounded-xl px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-500 text-white font-medium hover:opacity-90 transition disabled:opacity-60">
                      {creating ? 'Creating…' : 'Create Stream'}
                    </button>
                    <button type="button" onClick={() => setShowDeviceCheck(true)} className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500">
                      Run pre-flight check
                    </button>
                    <button type="button" onClick={() => setShowShortcuts(true)} className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500">
                      Keyboard shortcuts
                    </button>
                  </div>

                  <p className="text-xs text-white/50 mt-3">We create the stream on the server (safer than client keys).</p>
                </form>
              )}

              {stream && (
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  {/* Left: preview + controls */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${isLive ? 'border-red-500 bg-red-500/10' : 'border-white/15 bg-white/5'}`}>
                        <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
                        {isLive ? 'LIVE' : 'IDLE'}
                      </span>
                      {isLive && <span className="text-xs text-white/80">On-air: {formatDuration(now - (startedAt ?? now))}</span>}
                      {stream?.playbackId && (
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border border-white/15 bg-white/5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
                            <path d="M12 5c4.97 0 9 3.58 9 7.5S16.97 20 12 20 3 16.42 3 12.5 7.03 5 12 5zm0 2C8.14 7 5 9.68 5 12.5S8.14 18 12 18s7-2.68 7-5.5S15.86 7 12 7zm0 2.2a3.3 3.3 0 110 6.6 3.3 3.3 0 010-6.6z"/>
                          </svg>
                          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <button onClick={()=>setOverlayOpen(true)} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm focus:ring-2 focus:ring-pink-500">
                          Overlay
                        </button>
                        <a
                          href={`/composer/${stream.playbackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm focus:ring-2 focus:ring-pink-500"
                          title="Open the Composer tab, then in Broadcast click Share → This Tab to bake overlays."
                        >
                          Open Composer
                        </a>
                      </div>
                    </div>

                    {/* Preview + overlay */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                      {!ingestUrl ? (
                        <div className="aspect-video grid place-items-center text-white/80">Missing ingest URL…</div>
                      ) : (
                        <Broadcast.Root ingestUrl={ingestUrl} aspectRatio={16/9}>
                          <Broadcast.Container className="w-full h-full">
                            <Broadcast.Video className="w-full h-full" title="Live preview" />
                            {/* Overlay on top of preview */}
                            <div className="absolute inset-0 pointer-events-none">
                              <OverlayLayer config={overlayConfig} />
                            </div>

                            <Broadcast.Controls className="bg-gradient-to-b from-black/10 to-black/70 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Broadcast.VideoEnabledTrigger asChild>
                                    <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-xs" aria-label="Toggle camera">Cam</button>
                                  </Broadcast.VideoEnabledTrigger>
                                  <Broadcast.AudioEnabledTrigger asChild>
                                    <button ref={micRef} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-xs" aria-label="Toggle microphone">Mic</button>
                                  </Broadcast.AudioEnabledTrigger>
                                  <Broadcast.ScreenshareTrigger asChild>
                                    <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-xs" aria-label="Start screenshare">Share</button>
                                  </Broadcast.ScreenshareTrigger>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Broadcast.EnabledIndicator matcher={false}>
                                    <Broadcast.EnabledTrigger asChild>
                                      <button
                                        ref={startRef}
                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-500 text-sm font-medium"
                                        onClick={() => { setIsLive(true); setStartedAt(Date.now()); }}
                                        aria-label="Start broadcast"
                                      >
                                        Start
                                      </button>
                                    </Broadcast.EnabledTrigger>
                                  </Broadcast.EnabledIndicator>

                                  <Broadcast.EnabledIndicator>
                                    <Broadcast.EnabledTrigger asChild>
                                      <button
                                        ref={stopRef}
                                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
                                        onClick={() => { setIsLive(false); }}
                                        aria-label="Stop broadcast"
                                      >
                                        Stop
                                      </button>
                                    </Broadcast.EnabledTrigger>
                                  </Broadcast.EnabledIndicator>
                                </div>
                              </div>
                            </Broadcast.Controls>
                          </Broadcast.Container>
                        </Broadcast.Root>
                      )}
                    </div>
                  </div>

                  {/* Right: details + chat controls + OBS helper */}
                  <aside className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <h3 className="font-semibold">Stream details</h3>
                      <CopyField label="Title" value={title} />
                      <CopyField label="Playback ID" value={stream.playbackId} />
                      <CopyField label="Watch link (site)" value={`${siteOrigin}${watchUrl}`} />
                      <a
                        href={watchUrl}
                        className={`block text-center rounded-xl px-4 py-2 bg-gradient-to-r ${accent} text-white font-medium hover:opacity-90 transition`}
                        target="_blank" rel="noopener noreferrer"
                      >
                        Open viewer
                      </a>

                      <CopyField label="Livepeer public link" value={lvprUrl} />
                      <a
                        href={lvprUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-center rounded-xl px-4 py-2 bg-gradient-to-r ${accent} text-white font-medium hover:opacity-90 transition ${!lvprUrl ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        Open Livepeer link
                      </a>

                      <ShareMenu title={title} url={`${siteOrigin}${watchUrl}`} playbackId={stream.playbackId} utm="live" />

                      <div className="flex flex-wrap gap-2">
                        <button onClick={copyAll} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm focus:ring-2 focus:ring-pink-500">
                          Copy all details
                        </button>
                        <button onClick={() => setShowDeviceCheck(true)} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm focus:ring-2 focus:ring-pink-500">
                          Re-run pre-flight
                        </button>
                      </div>
                    </div>

                    {stream?.playbackId && <ChatControls playbackId={stream.playbackId} />}

                    <ObsOverlayGuide overlayId="stream" domain={siteOrigin} width={1920} height={1080} />
                  </aside>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <DeviceCheckModal open={showDeviceCheck} onClose={() => setShowDeviceCheck(false)} />
      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <OverlayCustomizer
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        playbackId={stream?.playbackId}
        config={overlayConfig}
        setConfig={setOverlayConfig}
        canToggleWatermark={false}
      />
    </>
>>>>>>> fix/supabase-ssr-migration2
  );
}
