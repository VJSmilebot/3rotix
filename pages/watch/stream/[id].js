import dynamic from 'next/dynamic';
import Head from 'next/head';
import { createSupabaseServerClient } from '../../../utils/supabase/server';

const LivepeerPlayer = dynamic(() => import('../../../components/LivepeerPlayer'), { ssr: false });

export async function getServerSideProps({ req, res, params }) {
  const streamId = params?.id || null;
  if (!streamId) {
    return { notFound: true };
  }

  const supabase = createSupabaseServerClient(req, res);

  // Fetch stream metadata from your DB or Livepeer API
  // For now, we'll just pass the streamId and let the client handle it
  // You can add a streams table later to store metadata

  return { 
    props: { 
      streamId,
    } 
  };
}

export default function StreamWatchPage({ streamId }) {
  return (
    <>
      <Head>
        <title>Stream Replay — 3rotix</title>
      </Head>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 12 }}>Stream Replay</h1>
        
        {/* 
          Livepeer streams use playbackId for replays.
          If your stream object has a playbackId, use that.
          Otherwise you might need to fetch it from Livepeer API.
        */}
        <LivepeerPlayer playbackId={streamId} autoplay={false} />
        
        <div style={{ marginTop: 20, color: '#888', fontSize: 14 }}>
          <p>Stream ID: {streamId}</p>
          <p>This is a past stream replay. Full metadata coming soon.</p>
        </div>
      </div>
    </>
  );
}