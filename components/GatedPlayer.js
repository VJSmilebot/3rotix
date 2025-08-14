// components/GatedPlayer.js
'use client';
import { useEffect, useState } from 'react';
// For Livepeer React v3+:
import { Player } from '@livepeer/react';

export default function GatedPlayer({ playbackId }) {
  const [jwt, setJwt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/livepeer/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playbackId }),
        });
        const data = await res.json();
        if (!res.ok || !data?.token) {
          throw new Error(data?.error || 'Failed to get playback token');
        }
        if (!cancelled) setJwt(data.token);
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => { cancelled = true; };
  }, [playbackId]);

  if (error) return <p style={{ padding: 20, color: 'tomato' }}>Player error: {error}</p>;
  if (!jwt) return <p style={{ padding: 20 }}>Loading video…</p>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Player
        title="Video"
        playbackId={playbackId}
        jwt={jwt}         // required for private/JWT‑gated assets; ignored for public
        autoPlay
        muted={false}
        showPipButton
        showTitle={false}
        theme={{ borderStyles: { containerBorderStyle: 'solid' } }}
      />
    </div>
  );
}
