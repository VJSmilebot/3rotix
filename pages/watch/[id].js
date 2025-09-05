// pages/watch/[id].js
import dynamic from 'next/dynamic';
<<<<<<< HEAD

const LivepeerPlayer = dynamic(() => import('../../components/LivepeerPlayer'), { ssr: false });

export async function getServerSideProps({ params }) {
  const playbackId = params?.id || null;
  return { props: { playbackId } };
}

export default function WatchPage({ playbackId }) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Watch: {playbackId}</h1>
      <LivepeerPlayer playbackId={playbackId} autoplay />
    </div>
  );
=======
import Head from 'next/head';
import { createSupabaseServerClient } from '../../utils/supabase/server';

// Dynamically import the players. GatedPlayer is client-side only.
const LivepeerPlayer = dynamic(() => import('../../components/LivepeerPlayer'), { ssr: false });
const GatedPlayer = dynamic(() => import('../../components/GatedPlayer'), { ssr: false });

export async function getServerSideProps({ req, res, params }) {
  const playbackId = params?.id || null;
  if (!playbackId) {
    return { notFound: true };
  }

  const supabase = createSupabaseServerClient(req, res);

  // Fetch the video's metadata to check its visibility
  const { data: video, error } = await supabase
    .from('videos')
    .select('title, visibility')
    .eq('playback_id', playbackId)
    .single();

  // If the video doesn't exist in our DB, it's not viewable via this page.
  if (error || !video) {
    return { notFound: true };
  }

  return { 
    props: { 
      playbackId,
      video, // Pass the video object to the page
    } 
  };
>>>>>>> fix/supabase-ssr-migration2
}

export default function WatchPage({ playbackId, video }) {
  const isPrivate = video.visibility === 'private';
  const pageTitle = video.title ? `${video.title} — 3rotix` : `Watch — 3rotix`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 12, wordBreak: 'break-all' }}>
          {video.title || playbackId}
        </h1>
        
        {/*
          Conditionally render the correct player.
          - If the video is private, GatedPlayer will handle fetching the JWT.
          - If public, the simple iframe player is used.
        */}
        {isPrivate ? (
          <GatedPlayer playbackId={playbackId} />
        ) : (
          <LivepeerPlayer playbackId={playbackId} autoplay />
        )}
      </div>
    </>
  );
}