import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../../utils/supabase/client';
import GatedPlayer from '../../components/GatedPlayer';

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });
  }, []);

  if (!user) return <p>Loading...</p>;

  return <GatedPlayer playbackId={id} />;
}
