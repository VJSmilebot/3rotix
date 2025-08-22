// pages/fan-portal.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import WaitlistModal from '../components/WaitlistModal';
import RoadmapModal from '../components/RoadmapModal';

export default function FanPortal() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20 text-center">
      <Head>
        <title>Fan Portal | 3ROTIX</title>
      </Head>

      {/* Intro */}
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-pink-500 mb-4">
          Welcome to the Fan Portal 🎉
        </h1>
        <p className="text-lg md:text-xl text-white/90 leading-relaxed">
          Being a fan on <span className="text-pink-400 font-semibold">3ROTIX</span> isn’t just
          about watching from the sidelines — it’s about <span className="font-semibold">earning,
          supporting, and shaping the future</span> of creator platforms.  
          We’re disrupting exploitation by putting fans and creators first, building an
          ethical system where your support fuels real change.  
          Through gamification, you’ll unlock rewards, earn recognition, and become part of a
          movement that’s rewriting the rules. Early fans and community members will score
          exclusive perks, badges, and insider access.  
          This isn’t just another platform — it’s a <span className="italic">game-changer</span>.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setShowWaitlist(true)}
          className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-lg font-semibold transition"
        >
          Join the Waitlist
        </button>

        <Link href="/legal/guidelines">
          <button className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-lg font-semibold transition">
            Community Guidelines
          </button>
        </Link>

        <button
          onClick={() => setShowRoadmap(true)}
          className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-lg font-semibold transition"
        >
          View Roadmap
        </button>

        <a
          href="https://t.me/disruptingexploitation"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 rounded-xl text-lg font-semibold text-center transition"
        >
          Explore Community
        </a>
      </div>

      {/* Modals */}
      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
      <RoadmapModal isOpen={showRoadmap} onClose={() => setShowRoadmap(false)} />
    </div>
  );
}
