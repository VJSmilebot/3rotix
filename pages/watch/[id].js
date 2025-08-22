// pages/watch/[id].js
import dynamic from 'next/dynamic';

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
}
