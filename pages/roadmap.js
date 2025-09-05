<<<<<<< HEAD
export default function Placeholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1>🚧 This page is under construction 🚧</h1>
    </div>
  );
}
=======
// pages/roadmap.js
import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// lazy load modal
const RoadmapModal = dynamic(() => import('../components/RoadmapModal'), { ssr: false });

const ACCENT = 'from-pink-500 to-fuchsia-500';

// Single source of truth for both page + modal
const SECTIONS = {
  live: [
    { t: 'Site foundation', d: 'Dark neon UI, mobile-first, Navbar/Footer stable.' },
    { t: 'Age Gate', d: 'First-visit 18+ interstitial.' },
    { t: 'Legal Hub (core docs imported)', d: 'TOS, Guidelines, 2257/Performer Release (polish ongoing).' },
    { t: 'Support & Contact', d: '/support with mailto flow; urgent DMCA/Safety guidance.' },
    { t: 'Blog (Builder’s Journal)', d: '/blog with search + tag filters (detail pages next).' },
    { t: 'Events & Streams', d: 'Minimal monthly calendar at /events.' },
    { t: 'Creator Onboarding', d: 'Progress-saving checklist + “Tools: Now & Upcoming”.' },
    { t: 'Streaming MVP', d: 'Livepeer wired with basic watch flow; live vs uploads split underway.' },
    { t: 'Image Upscaler MVP', d: 'Drag-and-drop, manual “Upscale”, transparency-friendly options.' },
    { t: 'Domain & Hosting', d: '3rotix.com DNS configured; Vercel deploys stable.' },
  ],
  inProgress: [
    { t: 'Auth + Profiles hardening', d: 'Smoother login/logout; reliable creator profile edits (Supabase).' },
    { t: 'Watch routes', d: 'Clean separation of live vs uploads (/watch vs /watch/uploads/[id]).' },
    { t: 'Gamification foundation', d: 'XP, badges, perks model + UI scaffold (no paywalling).' },
    { t: 'Legal polish', d: 'Performer Release flow, DMCA intake, consent/boundaries guidance.' },
    { t: 'Guides/Knowledge Hub', d: 'One-page list with tags/sorting; add links over time.' },
    { t: 'Creator Portal improvements', d: 'Branding assets, streaming keys UI, clearer first-run hints.' },
  ],
  nextUp: [
    { t: 'Support tickets (Supabase)', d: 'Replace mailto with lightweight ticketing + optional screenshot upload.' },
    { t: 'Safety toolkit', d: 'Consent templates, 2257 uploader, takedown pipeline (simple + auditable).' },
    { t: 'Monetization groundwork (pilot only)', d: 'Stripe Connect in sandbox; test flows (no go-live promise yet).' },
    { t: 'Blog post pages & RSS', d: '/blog/[slug] + RSS for updates.' },
    { t: 'Perf & A11y pass', d: 'Faster loads, better focus states, reduced-motion polish.' },
  ],
  exploring: [
    { t: 'Member-only access/passes', d: 'Simple access control (non-crypto first).' },
    { t: 'DM Assistant v1', d: 'Draft replies/templates; creator approves every send.' },
    { t: 'Real-time stream upscaling (feasibility)', d: 'Runpod experiments; ship only if stable + affordable.' },
    { t: 'Creator Dashboard', d: 'Unified uploads, live controls, analytics, safety tools.' },
    { t: 'Notifications', d: 'Telegram/Discord alerts for go-live, new posts, tickets.' },
    { t: 'Public feedback', d: 'Lightweight voting/comments on roadmap items.' },
  ],
  milestones: [
    { t: 'M1: Early Access (invite-only)', d: 'Reliable login, editable profiles, stable live playback, onboarding done, support triage live. Progress ~50%.' },
    { t: 'M2: Streaming Beta', d: 'Polished watch pages, basic chat, better error states.' },
    { t: 'M3: Monetization Pilot (test mode)', d: 'Payout flows proven in sandbox; compliance reviewed.' },
    { t: 'M4: Gamification Alpha', d: 'XP tracked for a few actions (read/watch), non-exploitative rewards.' },
    { t: 'M5: Broader Access', d: 'Open applications; safety toolkit + support ticketing solid.' },
  ],
};

export default function RoadmapPage() {
  const [isOpen, setIsOpen] = useState(false);

  const status = useMemo(() => ({
    live: SECTIONS.live.length,
    inProgress: SECTIONS.inProgress.length,
    nextUp: SECTIONS.nextUp.length,
    exploring: SECTIONS.exploring.length,
  }), []);

  return (
    <main className="min-h-screen bg-zinc-950">
      <section className="relative mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            3ROTIX Roadmap
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Straightforward and honest. ~50% of Early-Access goals are complete. We ship small, test with creators, and iterate—no over-promising.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Stat label="Live" value={status.live} />
            <Stat label="In Progress" value={status.inProgress} />
            <Stat label="Next Up" value={status.nextUp} />
            <Stat label="Exploring" value={status.exploring} />
            <button
              onClick={() => setIsOpen(true)}
              className="ml-auto rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition hover:opacity-95"
            >
              View as modal
            </button>
          </div>
        </div>

        {/* Intro */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className={`mb-3 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-80`} />
          <p className="text-sm text-white/70">
            We’re tired of exploitative platforms and bait-and-switch policies. Creators are the heart of this ecosystem: your work brings light to people who are hurting and lonely. Our role is to help you deliver your vision—safely, ethically, and without exploitation.
          </p>
        </div>

        <GridSection title="What’s Live" icon="✅" items={SECTIONS.live} />
        <GridSection title="In Progress" icon="🛠" items={SECTIONS.inProgress} />
        <GridSection title="Next Up" icon="🔜" items={SECTIONS.nextUp} />
        <GridSection title="Exploring / Later" icon="🧪" items={SECTIONS.exploring} />

        {/* Milestones */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white"><span className="mr-2">🎯</span>Milestones</h2>
            <span className={`h-0.5 w-20 bg-gradient-to-r ${ACCENT} opacity-80`} />
          </div>
          <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
            {SECTIONS.milestones.map((m) => (
              <li key={m.t}>
                <span className="text-white/90">{m.t}</span>{' '}
                <span className="text-white/50">— {m.d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Helpful links */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <LinkTile href="/blog" title="Builder’s Blog" desc="Weekly updates without the fluff." />
          <LinkTile href="/creator-onboarding" title="Creator Onboarding" desc="Get set up in clear steps." />
          <LinkTile href="/gamification" title="Gamification" desc="XP, perks, and non-exploitative rewards." />
          <LinkTile href="/support" title="Support" desc="Need help? We’ve got you." />
          <LinkTile href="/legal" title="Legal Hub" desc="TOS, Privacy, DMCA, 2257." />
          <LinkTile href="/platform" title="Platform Overview" desc="What we’re building and why." />
        </div>

        <div className="h-16" />
      </section>

      {/* Matching modal */}
      <RoadmapModal isOpen={isOpen} onClose={() => setIsOpen(false)} sections={SECTIONS} />
    </main>
  );
}

/* ------ UI bits ------ */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white/80">
      <span className="text-white/50">{label}:</span>{' '}
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function GridSection({ title, icon, items }) {
  const ACCENT = 'from-pink-500 to-fuchsia-500';
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white"><span className="mr-2">{icon}</span>{title}</h2>
        <span className={`h-0.5 w-20 bg-gradient-to-r ${ACCENT} opacity-80`} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10">
            <div className="text-sm font-semibold text-white">{i.t}</div>
            <div className="mt-1 text-xs text-white/70">{i.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LinkTile({ href, title, desc }) {
  const ACCENT = 'from-pink-500 to-fuchsia-500';
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/10 bg-zinc-900/40 p-4 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10"
    >
      <div className={`mb-2 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-60 transition group-hover:opacity-90`} />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-white/30">→</span>
      </div>
      <p className="mt-1 text-xs text-white/60">{desc}</p>
    </Link>
  );
}
>>>>>>> fix/supabase-ssr-migration2
