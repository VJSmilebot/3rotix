'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '../utils/supabase/client';

// Load the Livepeer Player client-side only
const Player = dynamic(
  async () => (await import('@livepeer/react/player')).Player,
  { ssr: false }
);

export default function LivepeerPlayer({ playbackId, title = 'Video' }) {
  const supabase = getSupabaseClient();
  const [src, setSrc] = useState(null);     // { src: string, type: 'hls' }
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Is the video private? (If yes, our API will return a JWT when you’re logged in)
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;

        const signRes = await fetch('/api/livepeer/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ playbackId }),
        });

        let jwt = null;
        if (signRes.ok) {
          const j = await signRes.json().catch(() => ({}));
          jwt = j?.token || null;
        }

        // 2) Ask our backend for the **official HLS URL** for this playbackId
        const pbRes = await fetch(`/api/livepeer/playback/${playbackId}`, { cache: 'no-store' });
        if (!pbRes.ok) {
          throw new Error('Could not resolve playback URL');
        }
        const { hlsUrl } = await pbRes.json();

        // Append ?jwt=… for private videos
        const url = jwt
          ? hlsUrl + (hlsUrl.includes('?') ? '&' : '?') + `jwt=${encodeURIComponent(jwt)}`
          : hlsUrl;

        if (!cancelled) {
          setSrc({ src: url, type: 'hls' });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Player setup failed');
      }
    })();

    return () => { cancelled = true; };
  }, [playbackId]);

  if (error) return <div style={{ color: 'tomato' }}>Player error: {error}</div>;
  if (!src)   return <div style={{ color: '#aaa' }}>Loading video…</div>;

  return (
    <Player
      title={title}
      autoPlay={false}
      muted={false}
      src={src}                 // <- Livepeer Player accepts { src, type: 'hls' }
      objectFit="contain"
      aspectRatio="16to9"
      theme={{
        borderStyles: { containerBorderStyle: 'hidden' },
        radii: { containerBorderRadius: '0px' },
      }}
    />
  );
}
