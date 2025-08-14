// components/GatedPlayer.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getSupabaseClient } from '../utils/supabase/client';

/**
 * Lightweight player using <video> + hls.js
 * - Works for public playback: https://lp-playback.com/hls/{playbackId}/index.m3u8
 * - Works for private playback: append ?jwt=<token>
 */
export default function GatedPlayer({ playbackId }) {
  const supabase = getSupabaseClient();
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errMsg, setErrMsg] = useState('');

  // 1) ask server for a token (or null for public)
  const [jwt, setJwt] = useState(undefined); // undefined=fetching, null=public/no token
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

        // If sign route errors (or user not logged in), try public playback
        if (!res.ok) {
          setJwt(null);
          return;
        }
        const json = await res.json().catch(() => ({}));
        setJwt(json?.token ?? null);
      } catch (e) {
        setJwt(null);
      }
    })();
    return () => { cancelled = true; };
  }, [playbackId]);

  // 2) once we have jwt (or know it’s public), wire up HLS
  useEffect(() => {
    if (jwt === undefined) return;    // still fetching
    const video = videoRef.current;
    if (!video) return;

    const base = `https://lp-playback.com/hls/${playbackId}/index.m3u8`;
    const src = jwt ? `${base}?jwt=${encodeURIComponent(jwt)}` : base;

    // Native HLS support (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setStatus('ready');
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setStatus('error');
        setErrMsg('Video element error.');
      });
      return () => {
        video.removeAttribute('src');
        video.load?.();
      };
    }

    // Other browsers → use hls.js
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);

      const onManifest = () => { setStatus('ready'); video.play().catch(() => {}); };
      const onErr = (e, data) => {
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
      setErrMsg('HLS is not supported in this browser.');
    }
  }, [jwt, playbackId]);

  if (!playbackId) return null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', background: '#000' }}>
        <video
          ref={videoRef}
          controls
          playsInline
          style={{ width: '100%', height: 'auto', background: '#000' }}
        />
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
