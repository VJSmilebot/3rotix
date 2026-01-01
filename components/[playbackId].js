'use client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import OverlayLayer from '@/components/OverlayLayer';

export default function Composer() {
  const { query, isReady } = useRouter();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [overlayConfig, setOverlayConfig] = useState({
    position: (query?.pos || 'br').toString(),
    size: (query?.size || 'standard').toString(),
    opacity: Math.max(0.4, Math.min(1, Number(query?.opacity || 0.9))),
    marginPx: Number(query?.margin || 24),
  });

  useEffect(() => {
    // Camera + mic for the layer; you’ll share THIS TAB in the Go Live page.
    (async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;
      } catch (e) {
        console.error(e);
        alert('Could not access camera in composer.');
      }
    })();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>Composer — 3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-[#0a0a0b] text-white">
        <section className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold mb-3">Composer (for Screen Share)</h1>
          <p className="text-white/70 mb-4">
            In <b>Go Live</b>, click <b>Share → This Tab</b>. This page composites your camera with overlays so it’s
            baked into the stream.
          </p>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none">
              <OverlayLayer config={overlayConfig} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
