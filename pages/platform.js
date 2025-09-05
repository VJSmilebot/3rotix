import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';

const ACCENT = 'from-pink-500 to-fuchsia-500';

const TOOLS = [
  // Status: 'live' | 'in-progress' | 'soon'
  { title: 'Live Streaming (creator-first)', desc: 'Go live with sensible controls and safety-first defaults.', href: '/streaming', status: 'live' },
  { title: 'Image Upscaler', desc: 'Make your brand assets crisp. Transparency-friendly, simple UI.', href: '/platform', status: 'live' },
  { title: 'XP & Perks', desc: 'Humane gamification: recognition > paywalls.', href: '/gamification', status: 'in-progress' },
  { title: 'DM Assistant', desc: 'Draft replies, keep your tone. You approve every send.', href: '/platform', status: 'in-progress' },
  { title: 'Brand Builder Kit', desc: 'Banners, palettes, and about-blocks to launch fast.', href: '/learn/guides', status: 'in-progress' },
  { title: 'Member-Only Access', desc: 'Grant access with simple passes. No lock-ins.', href: '/platform', status: 'soon' },
  { title: 'Creator Dashboard', desc: 'Uploads, live controls, analytics, safety—one place.', href: '/creator', status: 'soon' },
];

export default function Platform() {
  const counts = useMemo(() => ({
    live: TOOLS.filter(t => t.status === 'live').length,
    inProgress: TOOLS.filter(t => t.status === 'in-progress').length,
    soon: TOOLS.filter(t => t.status === 'soon').length,
  }), []);

  return (
    <>
      <Head>
        <title>3ROTIX — Platform Overview</title>
        <meta name="description" content="Creator-first, sex-positive, anti-exploitation platform. What’s live, what’s next, and how we help you bring light to the world." />
      </Head>

      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="relative mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Platform Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Creator-first, sex-positive, and anti-exploitation. We’re building tools that help artists bring real light to people who are hurting and lonely—safely, ethically, and with zero lock-ins.
            </p>
          </div>

          {/* At-a-glance stats + CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Stat label="Live" value={counts.live} />
            <Stat label="In Progress" value={counts.inProgress} />
            <Stat label="Soon" value={counts.soon} />
            <div className="flex flex-1 flex-wrap justify-start gap-2 sm:justify-end">
              <Link
                href="/creator-onboarding"
                className="rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition hover:opacity-95"
              >
                Start as a Creator
              </Link>
              <Link
                href="/roadmap"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/30"
              >
                View Roadmap
              </Link>
            </div>
          </div>

          {/* Why we exist */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
            <div className={`mb-2 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-80`} />
            <h2 className="text-base font-semibold text-white">Why this exists</h2>
            <p className="mt-1 text-sm text-white/70">
              We’re tired of platforms exploiting creators with bait-and-switch policies. You are the heart of this ecosystem—your art, intimacy, humor, and craft matter. Our job is to make it safer and easier to connect with people who need that light.
            </p>
          </div>

          {/* Tools grid */}
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Tools: Now & Upcoming</h2>
              <span className={`h-0.5 w-20 bg-gradient-to-r ${ACCENT} opacity-80`} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t) => (
                <ToolCard key={t.title} {...t} />
              ))}
            </div>
          </section>

          {/* Safety & Legal */}
          <section className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Safety, Consent, and Control</h3>
                <span className={`h-0.5 w-16 bg-gradient-to-r ${ACCENT} opacity-80`} />
              </div>
              <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                <li>Clear consent & boundaries (no gray areas).</li>
                <li>Creator-first Performer Release (you keep control of distribution and removals).</li>
                <li>Simple takedown path and 2257 compliance guidance.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/legal" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:border-white/30">
                  Legal Hub
                </Link>
                <Link href="/support" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:border-white/30">
                  Support & DMCA
                </Link>
              </div>
            </div>

            {/* Quick links card */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Quick links</h3>
                <span className={`h-0.5 w-16 bg-gradient-to-r ${ACCENT} opacity-80`} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Tile href="/creator" title="Creator Portal" desc="Profile, uploads, live controls." />
                <Tile href="/blog" title="Builder’s Blog" desc="What shipped lately." />
                <Tile href="/events" title="Events & Streams" desc="Where we’re live next." />
                <Tile href="/learn/guides" title="Guides" desc="Shooting, editing, promotion." />
              </div>
            </div>
          </section>

          {/* Footnote */}
          <p className="mt-8 text-center text-xs text-white/40">
            We build in public. Status and timelines may shift as we learn with the community—no hype we can’t back up.
          </p>

          <div className="h-16" />
        </section>
      </main>
    </>
  );
}

/* ---------- UI bits (no extra deps) ---------- */

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white/80">
      <span className="text-white/50">{label}:</span>{' '}
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function ToolCard({ title, desc, href, status }) {
  const badge = {
    'live': { label: 'Live', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'in-progress': { label: 'In Progress', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'soon': { label: 'Soon', cls: 'bg-white/10 text-white/70 border-white/20' },
  }[status];

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badge.cls}`}>{badge.label}</span>
      </div>
      <p className="mt-1 text-xs text-white/70">{desc}</p>
      <div className={`mt-3 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-70`} />
    </Link>
  );
}

function Tile({ href, title, desc }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/10 bg-zinc-900/40 p-4 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10"
    >
      <div className={`mb-2 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-60 transition group-hover:opacity-90`} />
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-white/30">→</span>
      </div>
      <p className="mt-1 text-xs text-white/60">{desc}</p>
    </Link>
  );
}
