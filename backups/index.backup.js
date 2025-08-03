import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import RoadmapModal from '../components/RoadmapModal';
import WaitlistModal from '../WaitlistModal';

export default function Home() {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-32 text-center overflow-hidden">
      <Head>
        <title>3ROTIX</title>
      </Head>

      {/* Background Logo */}
      <div className="absolute inset-0 flex justify-center items-center opacity-10 z-0 pointer-events-none">
        <Image
          src="/logo.png"
          alt="3ROTIX Logo Background"
          layout="fill"
          objectFit="contain"
          className="pointer-events-none"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl w-full space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-pink-500 mb-4">
          3ROTIX
        </h1>
        <p className="text-lg md:text-xl text-gray-300 font-semibold">
          Disrupting Exploitation. By Creators, For Creators.
        </p>
        <p className="text-lg md:text-xl text-gray-300">
          Build your brand. Take a stand.
        </p>
        <p className="text-base md:text-lg text-gray-300 mt-4">
          3ROTIX is a creator-powered movement reshaping the way platforms support and share value.
          We're building tools that let you create, stream, and thrive — without compromise.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
          <a
            href="https://t.me/DisruptingExploitation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-lg font-semibold transition"
          >
            Visit Our Community
          </a>
          <button
            onClick={() => setIsRoadmapOpen(true)}
            className="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-lg font-semibold transition"
          >
            See Our Roadmap
          </button>
          <button
            onClick={() => setIsWaitlistOpen(true)}
            className="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-lg font-semibold transition"
          >
            Join The Waitlist
          </button>
        </div>
      </div>
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
  );
}
