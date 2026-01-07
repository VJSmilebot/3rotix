// pages/streaming.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import * as Broadcast from '@livepeer/react/broadcast';
import { getIngest } from '@livepeer/react/external';

import CopyField from '../components/CopyField';
import DeviceCheckModal from '../components/DeviceCheckModal';
import ShortcutHelp from '../components/ShortcutHelp';
import OverlayLayer from '../components/OverlayLayer';
import OverlayCustomizer from '../components/OverlayCustomizer';
import ObsOverlayGuide from '../components/ObsOverlayGuide';
import ShareMenu from '../components/ShareMenu';
import ChatControls from '../components/ChatControls';

// ✅ FIX: useAuth comes from context
import { useAuth } from '../context/AuthContext';

const accent = 'from-pink-600 to-purple-500';

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600).toString().padStart(2, '0');
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return hh === '00' ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

export default function Streaming() {
  // ✅ FIX: your AuthContext provides { user, supabase, ready }
  const { user, supabase, ready } = useAuth() || {};
  const loading = !ready;

  const [canBroadcast, setCanBroadcast] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!ready) return;
      if (!user || !supabase) {
        if (!cancelled) setRoleChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        // ✅ FIX: select the fields you actually use
        .select('role, plan_tier, is_creator')
        .eq('id', user.id)
        .maybeSingle();

      const role = (profile?.role || user.user_metadata?.role || 'fan').toLowerCase();
      const plan = (profile?.plan_tier || '').toLowerCase();

      const allowed =
        !!profile?.is_creator ||
        role === 'creator' ||
        role === 'admin' ||
        ['pro', 'creator', 'vip'].includes(plan);

      if (!cancelled) {
        setCanBroadcast(!!allowed);
        setRoleChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.id, supabase]);

  // -------- Create stream form --------
  const [title, setTitle] = useState('Going live on 3ROTIX');
  const [record, setRecord] = useState(true);
  const [nsfw, setNsfw] = useState(true);

  const [creating, setCreating] = useState(false);
  const [stream, setStream] = useState(null);

  const [showDeviceCheck, setShowDeviceCheck] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  const [isLive, setIsLive] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [viewerCount, setViewerCount] = useState(0);

  const startRef = useRef(null);
  const stopRef = useRef(null);
  const micRef = useRef(null);

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const watchUrl = stream?.playbackId ? `/watch/${stream.playbackId}` : '';
  const lvprUrl = stream?.playbackId ? `https://lvpr.tv/?v=${stream.playbackId}` : '';

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
    if (!supabase) {
      alert('Auth not ready yet — try again in a second.');
      return;
    }

    setCreating(true);
    try {
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

      setStream({
        id: data.id,
        playbackId: data.playbackId,
        streamKey: data.streamKey,
        rtmpIngestUrl: data.rtmpIngestUrl || 'rtmp://rtmp.livepeer.com/live',
        webrtcIngestUrl:
          data.webrtcIngestUrl ||
          (data.streamKey ? `https://playback.livepeer.studio/webrtc/${data.streamKey}` : null),
      });
    } catch (err) {
      alert(err.message || 'Failed to create stream.');
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 's' || e.key === 'S') {
        if (!isLive) startRef.current?.click();
        else stopRef.current?.click();
      } else if (e.key === 'm' || e.key === 'M') {
        micRef.current?.click();
      } else if (e.key === '?') {
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  // ✅ guard presence until supabase exists
  useEffect(() => {
    const pid = stream?.playbackId;
    if (!pid || !supabase) return;

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
    return () => {
      try {
        ch.unsubscribe();
      } catch {}
    };
  }, [stream?.playbackId, supabase]);

  return (
    <>
      <Head>
        <title>Go Live — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ...the rest of your JSX stays the same... */}
      {/* (no other changes required for the build errors) */}

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        {/* your existing UI */}
      </main>

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
  );
}
