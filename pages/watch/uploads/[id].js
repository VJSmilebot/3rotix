// pages/v/[id].js
'use client';

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
// Fix supabase path - use absolute import
import { supabase } from '../../../lib/supabaseClient';

// Updated LivepeerPlayer component with official Livepeer embed format
const LivepeerPlayer = ({ playbackId, title }) => {
  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        src={`https://lvpr.tv?v=${playbackId}`}
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        frameBorder="0"
        className="w-full h-full"
        title={title || 'Video'}
      />
    </div>
  );
};

export default function VodWatch() {
  const router = useRouter();
  const { query, isReady } = router;
  const playbackId = (query?.id || '').toString();

  // Optional: load basic metadata if you store it in Supabase (videos table)
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isReady || !playbackId) return;
      try {
        console.log("Querying for playback_id:", playbackId);
        // If you don't have this table yet, this quietly no-ops
        const { data, error } = await supabase
          .from('videos')
          .select('title')
          .eq('playback_id', playbackId)
          .maybeSingle();
          
        if (error) {
          console.error("Supabase query error:", error);
        }
        
        if (mounted) setMeta(data || null);
      } catch (err) { 
        console.error("Error fetching video metadata:", err);
      }
    })();
    return () => { mounted = false; };
  }, [isReady, playbackId]);

  const pageTitle = meta?.title || 'Video';
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/v/${playbackId}`;
  }, [playbackId]);

  return (
    <>
      <Head>
        <title>{pageTitle} — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
            {meta?.description && (
              <p className="text-white/70 mt-1">{meta.description}</p>
            )}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
            {!isReady || !playbackId ? (
              <div className="aspect-video grid place-items-center text-white/80">Loading…</div>
            ) : (
              <LivepeerPlayer playbackId={playbackId} title={pageTitle} />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              id="copy-link"
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  alert('VOD link copied');
                } catch { /* ignore */ }
              }}
            >
              Copy link
            </button>
            <a
              href={`https://lvpr.tv/?v=${playbackId}`}
              target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10"
              id="open-in-livepeer"
            >
              Open in Livepeer
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
