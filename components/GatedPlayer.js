// components/GatedPlayer.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getSupabaseClient } from '../utils/supabase/client';

export default function GatedPlayer({ playbackId }) {
  const supabase = getSupabaseClient();
  const videoRef = useRef(null);

  const [jwt, setJwt] = useState(undefined); // undefined = fetching, null = public/no token
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errMsg, setErrMsg] = useState('');

  // 1) Ask our server if this needs a JWT (private) or not (public)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;

        const res = await fetch('/api/livepeer/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ playbackId }),
        });

        if (!res.ok) {
          // not logged in / forbidden → treat as public (will fail for private)
          setJwt(null);
          return;
        }
        const j = await res.json().catch(() => ({}));
        setJwt(j?.token ?? null);
      } catch {
        setJwt(null);
      }
    })();
    return () => { cancelled = true; };
  }, [playbackId]);

  // Use only browser-friendly CDNs
  const candidatesFor = (id, token) => {
    const q = token ? `?jwt=${encodeURIComponent(token)}` : '';
    return [
      // This one allows cross-origin requests from your site
      `https://livepeercdn.studio/hls/${id}/index.m3u8${q}`,
      // Keep as a last resort (often 404 for VOD)
      `https://lp-playback.com/hls/${id}/index.m3u8${q}`,
      // DO NOT use vod-cdn.lp-playback.studio in the browser — CORS 403
    ];
  };

  // Probe and require real stream levels in the master manifest
  async function probeManifest(url) {
    try {
      const r = await fetch(url, { method: 'GET', cache: 'no-store' });
      console.log('[Player] probe', url, r.status);
      if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
      const text = await r.text();
      const hasLevels = /#EXT-X-STREAM-INF/i.test(text);
      return { ok: hasLevels, reason: hasLevels ? 'has levels' : 'no levels yet', url };
    } catch (e) {
      return { ok: false, reason: String(e) };
    }
  }

  // 2) Once we know jwt/public, try to play with retries until levels exist
  useEffect(() => {
    if (jwt === undefined || !playbackId) return;

    let destroyed = false;
    let hls;

    const MAX_TRIES = 12;   // ~36s total
    const SLEEP_MS  = 3000;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const setup = async () => {
      setStatus('loading');

      let src = null;
      for (let attempt = 1; attempt <= MAX_TRIES && !src; attempt++) {
        // Try each candidate base in order
        const cands = candidatesFor(playbackId, jwt);
        for (const c of cands) {
          const p = await probeManifest(c);
          if (p.ok) { src = c; break; }
          console.warn(`[Player] manifest not ready (${p.reason}) — try ${attempt}/${MAX_TRIES}`);
        }
        if (!src) await sleep(SLEEP_MS);
      }

      if (!src) {
        setStatus('error');
        setErrMsg('Could not load HLS manifest (still packaging or wrong ID).');
        return;
      }

      console.log('[Player] using manifest', src);

      const video = videoRef.current;
      if (!video) return;

      const onReady = () => { setStatus('ready'); video.play().catch(() => {}); };
      const onVideoError = () => { setStatus('error'); setErrMsg('Video element error.'); };

      // Native HLS (Safari/iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', onReady);
        video.addEventListener('error', onVideoError);
        return () => {
          video.removeEventListener('loadedmetadata', onReady);
          video.removeEventListener('error', onVideoError);
          video.removeAttribute('src'); video.load?.();
        };
      }

      // Other browsers → hls.js
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);

        const onManifest = () => onReady();
        const onErr = async (event, data) => {
          console.error('[HLS] error', data?.type, data?.details);
          // If manifest/levels glitch, re-run the full setup (will re-probe)
          if (data?.details?.toLowerCase().includes('manifest')) {
            setStatus('loading');
            hls?.destroy();
            await sleep(1500);
            if (!destroyed) setup();
            return;
          }
          setStatus('error');
          setErrMsg(data?.details || 'HLS error');
        };

        hls.on(Hls.Events.MANIFEST_PARSED, onManifest);
        hls.on(Hls.Events.ERROR, onErr);

        return () => {
          hls.off(Hls.Events.MANIFEST_PARSED, onManifest);
          hls.off(Hls.Events.ERROR, onErr);
          hls.destroy();
        };
      } else {
        setStatus('error');
        setErrMsg('HLS not supported in this browser.');
      }
    };

    setup();
    return () => { destroyed = true; if (hls) hls.destroy(); };
  }, [jwt, playbackId]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ position: 'relative', background: '#000' }}>
        <video ref={videoRef} controls playsInline style={{ width: '100%', background: '#000' }} />
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#aaa' }}>
            Loading video…
          </div>
        )}
        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'tomato' }}>
            Player error: {errMsg}
          </div>
        )}
      </div>
    </div>
  );
}
