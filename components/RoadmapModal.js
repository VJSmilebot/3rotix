import React from 'react';

export default function RoadmapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center px-4">
      <div className="bg-[#0f0f0f] text-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg relative border border-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Modal Content */}
        <h2 className="text-2xl font-bold mb-4 text-center">3ROTIX Roadmap</h2>
        <div className="space-y-6 text-sm leading-relaxed">

          {/* Phase 1 */}
          <div>
            <h3 className="font-semibold text-white/90">🔓 Phase 1: Foundation</h3>
            <ul className="list-disc ml-5 text-white/80">
              <li>Landing page with age gate & brand messaging</li>
              <li>Waitlist signup connected to Google Sheets</li>
              <li>Telegram & social presence rollout</li>
              <li>Project Notion board & visual roadmap modal</li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div>
            <h3 className="font-semibold text-white/90">🛠 Phase 2: Creator Tools</h3>
            <ul className="list-disc ml-5 text-white/80">
              <li>Live stream feature (100% earnings launch promo)</li>
              <li>Basic profile pages with link hub & media support</li>
              <li>Token-gated options and tipping integration</li>
              <li>Initial gamification (badges, levels)</li>
            </ul>
          </div>

          {/* Phase 3 */}
          <div>
            <h3 className="font-semibold text-white/90">🚀 Phase 3: Launch & Growth</h3>
            <ul className="list-disc ml-5 text-white/80">
              <li>Public launch + minting / early adopter rewards</li>
              <li>Creator onboarding campaign</li>
              <li>Community building tools & content prompts</li>
              <li>XP, streaks, and leaderboard-based engagement</li>
            </ul>
          </div>

          {/* Phase 4 */}
          <div>
            <h3 className="font-semibold text-white/90">🌍 Phase 4: Expansion</h3>
            <ul className="list-disc ml-5 text-white/80">
              <li>Mobile optimization and native app prototypes</li>
              <li>Decentralized media hosting and backup options</li>
              <li>Creator DAO proposals and collaborative tools</li>
              <li>Real-world collabs, events, & exclusive perks</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
