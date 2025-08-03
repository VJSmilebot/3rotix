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
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image
          src="/logo.png"
          alt="3ROTIX watermark"
          layout="fill"           /* if your Next version prefers 'fill' prop, use: fill */
          objectFit="contain"     /* or style={{ objectFit: 'contain' }} with 'fill' */
          priority
        />
      </div>

      {/* Hero copy */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-20 md:py-28">
        <h1 className="font-extrabold text-pink-500 mb-2 text-[clamp(2rem,7vw,3.75rem)] leading-tight">
          3ROTIX
        </h1>
        <p className="font-semibold text-white mb-1 text-[clamp(1rem,4.5vw,1.75rem)]">
          Disrupting Exploitation. By Creators, For Creators.
        </p>
        <p className="text-white/90 text-[clamp(0.95rem,4vw,1.25rem)]">
          Build your brand. Take a stand.
        </p>

        {/* CTA row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://t.me/disruptingexploitation"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold"
          >
            Join Telegram
          </a>

          <a
            href="mailto:smilebot3000@gmail.com"
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200"
          >
            Email Us
          </a>

          <button
            onClick={() => setShowWaitlist(true)}
            className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
          >
            Join Waitlist
          </button>

          <button
            onClick={() => setShowRoadmap(true)}
            className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
          >
            View Roadmap
          </button>
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
