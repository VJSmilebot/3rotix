// pages/watch/[id].js
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';

// Load the player on the client only.
const GatedPlayer = dynamic(() => import('../../components/GatedPlayer'), { ssr: false });

export default function WatchPage() {
  const router = useRouter();
  const playbackId = router.query.id; // URL: /watch/<playbackId>
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // require login for /watch (you can relax this if you want public playback)
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push('/login');
      else setUser(data.user);
    });
  }, []);

  if (!playbackId) return <p style={{ padding: 20 }}>Loading video…</p>;
  if (!user) return <p style={{ padding: 20 }}>Checking session…</p>;

  return <GatedPlayer playbackId={playbackId} />;
}
