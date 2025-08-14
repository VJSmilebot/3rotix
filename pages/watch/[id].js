import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';

const GatedPlayer = dynamic(() => import('../../components/GatedPlayer'), { ssr: false });

export default function WatchPage() {
  const router = useRouter();
  const playbackId = router.query.id;
  const supabase = getSupabaseClient();
  const [ready, setReady] = useState(false);

  // Optional: require login to watch (you can remove this if you want public watch)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push('/login');
      else setReady(true);
    });
  }, []);

  if (!playbackId) return <p style={{ padding: 20 }}>Loading…</p>;
  if (!ready) return <p style={{ padding: 20 }}>Checking session…</p>;

  return <GatedPlayer playbackId={playbackId} />;
}
