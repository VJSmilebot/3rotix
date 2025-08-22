import { useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import WaitlistModal from '../components/WaitlistModal';
import RoadmapModal from '../components/RoadmapModal';

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center text-center">
      <Head>
        <title>3ROTIX</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Background logo (subtle on mobile) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none scale-175">
        <Image
          src="/logo.png"
          alt="3ROTIX watermark"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Hero copy */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-20 md:py-28">
        <div className="relative w-full h-[150px] md:h-[220px]">
          <Image
            src="/goo3.png"
            alt="3ROTIX Hero"
            fill
            style={{ objectFit: "contain" }}
            priority
            className="mx-auto mb-2"
          />
        </div>

        <p className="font-semibold text-white mb-1 text-[clamp(1rem,4.5vw,1.75rem)]">
          Disrupting Exploitation. By Creators, For Creators.
        </p>
        <p className="text-white/90 text-[clamp(0.95rem,4vw,1.25rem)]">
          Build your brand. Take a stand.
        </p>

        {/* CTA row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/creator-portal"
            className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold"
          >
            Creator Portal
          </a>

          <a
            href="/fan-portal"
            className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
          >
            Join as a Fan
          </a>
        </div>

        {/* Small links under CTAs */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center text-sm text-white/70">
          <button
            onClick={() => setShowRoadmap(true)}
            className="hover:text-pink-400"
          >
            View Roadmap
          </button>
          <a href="/community" className="hover:text-pink-400">
            Explore Community
          </a>
        </div>
      </div>

      {/* Below-the-fold intro */}
      <section className="relative z-10 w-full max-w-3xl px-4 pb-16 md:pb-24">
        <p className="text-base md:text-lg text-white/85">
          3ROTIX is a creator-powered movement reshaping the way platforms support and share value.
          We’re building tools that let you create, stream, and thrive — without compromise.
        </p>
      </section>

      {/* Modals */}
      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
      <RoadmapModal isOpen={showRoadmap} onClose={() => setShowRoadmap(false)} />
    </div>
  );
}
