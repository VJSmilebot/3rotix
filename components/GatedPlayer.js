// components/GatedPlayer.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getSupabaseClient } from '../utils/supabase/client';

export default function GatedPlayer({ playbackId }) {
  const supabase = getSupabaseClient();
  const videoRef = useRef(null);

  const [jwt, setJwt] = useState(undefined); // undefined=fetching, null=public
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errMsg, setErrMsg] = useState('');

  // 1) Ask our server if we need a JWT (private) or not (public)
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
          console.warn('[Player] sign route not OK', res.status);
          setJwt(null); // try public anyway
          return;
        }
        const j = await res.json().catch(() => ({}));
        setJwt(j?.token ?? null);
      } catch (e) {
        console.warn('[Player] sign route failed', e);
        setJwt(null);
      }
    })();
    return () => { cancelled = true; };
  }, [playbackId]);

  // 2) Pick a working manifest URL; prefer lp-playback.com, fall back to livepeercdn.studio
  async function chooseManifestUrl(token) {
    const bases = [
      `https://lp-playback.com/hls/${playbackId}/index.m3u8`,
      `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`,
    ];
    for (const base of bases) {
      const url = token ? `${base}?jwt=${encodeURIComponent(token)}` : base;
      try {
        const head = await fetch(url, { method: 'GET' }); // head often blocked; do GET
        console.log('[Player] probe', url, head.status);
        if (head.ok) return url;
      } catch (e) {
        console.warn('[Player] probe failed', url, e);
      }
    }
    return null;
  }

  // 3) Wire up HLS once jwt/public decision is known
  useEffect(() => {
    if (jwt === undefined || !playbackId) return;
    let hls;
    const video = videoRef.current;
    if (!video) return;

    (async () => {
      setStatus('loading');

      const src = await chooseManifestUrl(jwt);
      if (!src) {
        setStatus('error');
        setErrMsg('Could not load manifest (404/blocked). Is the playback ID correct and asset ready?');
        return;
      }

      console.log('[Player] using manifest', src);

      // Safari / iOS: native HLS
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        const onLoaded = () => { setStatus('ready'); video.play().catch(() => {}); };
        const onError = () => { setStatus('error'); setErrMsg('Video element error.'); };
        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onError);
        return () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
          video.removeAttribute('src'); video.load?.();
        };
      }

      // Other browsers: hls.js
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);

        const onManifest = () => { setStatus('ready'); video.play().catch(() => {}); };
        const onErr = (event, data) => {
          console.error('[HLS] error', data?.type, data?.details, data);
          setStatus('error');
          setErrMsg(`manifestLoadError: ${data?.details || 'unknown'}`);
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
    })();

    return () => {
      if (hls) hls.destroy();
    };
  }, [jwt, playbackId]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', background: '#000' }}>
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
