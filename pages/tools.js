// pages/tools.js
import Head from "next/head";

export default function Tools() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-16 px-6">
      <Head>
        <title>3ROTIX Creator Tools</title>
      </Head>

      {/* Intro */}
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-pink-500">
          Creator Toolbox
        </h1>
        <p className="text-lg text-white/90 leading-relaxed">
          We already have a handful of tools nearly ready to launch — and many more rolling out as we grow. 
          This toolbox is your backstage pass to building, protecting, and scaling your brand. 
          Jump in, test what’s live, and keep an eye out for what’s coming next.
        </p>
      </div>

      {/* Sections */}
      <div className="w-full max-w-4xl space-y-10">
        {/* Content Tools */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Content Tools</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white">
              Image Upscaler — HD Fix
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Video Splicer — AI Editing
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Flyer Maker — Quick Promos
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              3D Model Viewer — Interactive
            </button>
          </div>
        </section>

        {/* AI / Automation */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">AI & Automation</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white">
              DM Assistant — Auto Replies
            </button>
            <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white">
              Brand Builder — Identity Kit
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Caption & Hashtag Generator
            </button>
          </div>
        </section>

        {/* Community & Growth */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Community & Growth</h2>
          <div className="flex flex-wrap gap-3">
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Community Launcher — Fan Hub
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Gamification — XP & Badges
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Referral Tracker — Earn Together
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Creator Collab Hub
            </button>
          </div>
        </section>

        {/* Streaming & Monetization */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Streaming & Monetization</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white">
              Streaming Tool — Go Live
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Tipping Widget — Instant Support
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              NFT Minting — Collectibles
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Content Vault — Gated Access
            </button>
          </div>
        </section>

        {/* Safety & Compliance */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Safety & Compliance</h2>
          <div className="flex flex-wrap gap-3">
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              2257 Doc Manager
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              DMCA Helper
            </button>
            <button disabled className="px-4 py-2 bg-gray-800 rounded-lg text-gray-500 cursor-not-allowed">
              Watermarking Tool
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
