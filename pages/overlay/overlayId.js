'use client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import OverlayLayer from '../../components/OverlayLayer';

export default function OBSOverlay() {
  const { query } = useRouter();
  const width  = Number(query.w || 1920);
  const height = Number(query.h || 1080);

  const config = {
    position: (query.pos || 'br').toString(),
    size: (query.size || 'standard').toString(),
    opacity: Math.max(0.4, Math.min(1, Number(query.opacity || 0.9))),
    marginPx: Number(query.margin || 24),
  };

  return (
    <>
      <Head>
        <title>3ROTIX Overlay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        html, body, #__next { background: transparent !important; }
      `}</style>

      <main className="bg-transparent">
        <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
          <OverlayLayer config={config} />
        </div>
      </main>
    </>
  );
}
