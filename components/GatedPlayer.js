// components/GatedPlayer.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getSupabaseClient } from '../utils/supabase/client';

export default function GatedPlayer({ playbackId }) {
  const supabase = getSupabaseClient();
  const videoRef = useRef(null);

  const [jwt, setJwt] = useState(undefined);      // undefined = checking, null = public
  const [hlsUrl, setHlsUrl] = useState(null);     // resolved master manifest URL
  const [status, setStatus] = useState('loading');// loading | ready | error
  const [errMsg, setErrMsg] = useState('');

  // 1) Decide if this is private (needs JWT) or public
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const tok = data?.session?.access_token;
        const r = await fetch('/api/livepeer/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
          body: JSON.stringify({ playbackId }),
        });
        if (!stop) {
          if (!r.ok) setJwt(null); // treat as public if not logged in / forbidden
          else {
            const j = await r.json().catch(() => ({}));
            setJwt(j?.token ?? null);
          }
        }
      } catch {
        if (!stop) setJwt(null);
      }
    })();
    return () => { stop = true; };
  }, [playbackId]);

  // 2) Ask Livepeer (via our server) for the correct HLS URL for this playbackId
  useEffect(() => {
    if (jwt === undefined) return;
    let stop = false;
    (async () => {
      try {
        const r = await fetch(`/api/livepeer/playback/${playbackId}`, { cache: 'no-store' });
        const j = await r.json();
        if (!stop) {
          let url = j?.hlsUrl;
          if (!url) throw new Error('No HLS URL from playback info');
          if (jwt) {
            const sep = url.includes('?') ? '&' : '?';
            url = `${url}${sep}jwt=${encodeURIComponent(jwt)}`;
          }
          setHlsUrl(url);
        }
      } catch (e) {
        if (!stop) { setStatus('error'); setErrMsg('Could not resolve HLS URL'); }
      }
    })();
    return () => { stop = true; };
  }, [playbackId, jwt]);

  // 3) Load with hls.js (and wait until manifest actually has variants)
  useEffect(() => {
    if (!hlsUrl) return;
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let hls;

    const MAX_TRIES = 40; // ~120s
    const SLEEP = 3000;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const hasLevels = async (url) => {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return false;
      const text = await r.text();
      return /#EXT-X-STREAM-INF/i.test(text);
    };

    const start = async () => {
      setStatus('loading');

      // Wait until master manifest lists variants
      let ok = false;
      for (let i = 1; i <= MAX_TRIES; i++) {
        try {
          const ready = await hasLevels(hlsUrl);
          console.log(`[Player] probe manifest → ${ready ? 'OK' : 'not ready'} (${i}/${MAX_TRIES})`);
          if (ready) { ok = true; break; }
        } catch {}
        await sleep(SLEEP);
        if (destroyed) return;
      }
      if (!ok) { setStatus('error'); setErrMsg('Could not load HLS manifest (still packaging or wrong ID).'); return; }

      const onReady = () => { setStatus('ready'); video.play().catch(() => {}); };
      const onVideoError = () => { setStatus('error'); setErrMsg('Video element error.'); };

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', onReady);
        video.addEventListener('error', onVideoError);
        return () => {
          video.removeEventListener('loadedmetadata', onReady);
          video.removeEventListener('error', onVideoError);
          video.removeAttribute('src'); video.load?.();
        };
      }

      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        const onManifest = () => onReady();
        const onErr = async (_e, data) => {
          console.error('[HLS] error', data?.type, data?.details);
          if (String(data?.details).toLowerCase().includes('manifest')) {
            setStatus('loading');
            hls?.destroy();
            await sleep(1500);
            if (!destroyed) start();
            return;
          }
          setStatus('error');
          setErrMsg(data?.details || 'HLS error');
        };

        hls.on(Hls.Events.MANIFEST_PARSED, onManifest);
        hls.on(Hls.Events.ERROR, onErr);
        return () => { hls.destroy(); };
      }

      setStatus('error'); setErrMsg('HLS not supported in this browser.');
    };

    start();
    return () => { destroyed = true; if (hls) hls.destroy(); };
  }, [hlsUrl]);

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
