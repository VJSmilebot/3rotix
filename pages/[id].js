'use client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Player } from '@livepeer/react';

export default function Watch() {
  const { query, isReady } = useRouter();
  const playbackId = (query?.id || query?.playbackId || '').toString();

  return (
    <>
      <Head>
        <title>Watch — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        <section className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Live Stream</h1>

          {!isReady || !playbackId ? (
            <div className="aspect-video grid place-items-center rounded-2xl border border-white/10 bg-white/5">
              Loading player…
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
              <Player
                title="3ROTIX Live"
                playbackId={playbackId}
                autoPlay
                muted
                showPipButton
                showTitle={false}
                aspectRatio="16to9"
              />
            </div>
          )}

          <p className="text-xs text-white/60 mt-3">
            If latency seems high, also test on <code className="bg-black/40 px-1 py-0.5 rounded">lvpr.tv/?v={playbackId}</code>.
          </p>
        </section>
      </main>
    </>
  );
}
    