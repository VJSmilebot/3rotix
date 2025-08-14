// components/GatedPlayer.js
'use client';
import { useEffect, useState } from 'react';
import { Player } from '@livepeer/react';
import { getSupabaseClient } from '../utils/supabase/client';

export default function GatedPlayer({ playbackId }) {
  const supabase = getSupabaseClient();
  const [jwt, setJwt] = useState(undefined); // undefined=loading, null=no token needed
  const [err, setErr] = useState(null);

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
          // For public videos or API errors, fall back to no token
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

  if (!playbackId) return null;
  if (err) return <p style={{ color: 'tomato', padding: 20 }}>Player error: {String(err)}</p>;
  if (jwt === undefined) return <p style={{ padding: 20 }}>Loading video…</p>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Player
        title="Video"
        playbackId={playbackId}
        jwt={jwt || undefined}   // only pass if present
        autoPlay
        showPipButton
        showTitle={false}
      />
    </div>
  );
}
