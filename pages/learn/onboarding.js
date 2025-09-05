<<<<<<< HEAD
export default function Placeholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1>🚧 This page is under construction 🚧</h1>
    </div>
  );
}
=======
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const ACCENT = 'from-pink-500 to-fuchsia-500';
const STORAGE_KEY = 'creator_onboarding_progress_v1';
const SUPPORT_EMAIL = 'support@3rotix.com';
const FOUNDER_EMAIL = 'smiley@3rotix.com';

// Tools we mention without overpromising — link to safe, existing pages.
// Status: 'live' | 'in-progress' | 'soon'
const TOOLS = [
  {
    title: 'Live Streaming (creator-first)',
    status: 'live',
    desc: 'Go live with sensible controls. Built on modern infra, tuned for performers.',
    href: '/streaming',
  },
  {
    title: 'Image Upscaler',
    status: 'live',
    desc: 'Make brand assets crisp. Transparency-friendly, simple UI.',
    href: '/platform', // link to overview for now (adjust later if you’ve got a dedicated route)
  },
  {
    title: 'XP & Perks',
    status: 'in-progress',
    desc: 'Fans earn recognition and creators grow community—humane gamification.',
    href: '/gamification',
  },
  {
    title: 'DM Assistant',
    status: 'in-progress',
    desc: 'Draft replies, triage, and keep your tone—your voice stays yours.',
    href: '/platform',
  },
  {
    title: 'Brand Builder Kit',
    status: 'in-progress',
    desc: 'Banners, palettes, and quick “about” blocks to get you publish-ready.',
    href: '/learn/guides',
  },
  {
    title: 'Member-Only Access',
    status: 'soon',
    desc: 'Grant access with simple passes—no dark patterns or lock-ins.',
    href: '/platform',
  },
  {
    title: 'Creator Dashboard',
    status: 'soon',
    desc: 'One place for uploads, live, earnings setup, and safety tools.',
    href: '/creator',
  },
];

const BASE_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome & What We Stand For',
    desc:
      'We built 3ROTIX because we’re tired of seeing creators exploited. You are the heart of this ecosystem. Our job is to support your vision—ethically, transparently, and with tools that actually help.',
    href: '/legal',
    cta: 'Review the Legal Hub',
    nsfw: false,
  },
  {
    id: 'id-verify',
    title: 'Verify Age & ID',
    desc:
      'Bring a valid government ID. Automated verification is coming—manual check for now to keep everyone safe.',
    href: '/legal',
    cta: 'See ID Requirements',
    nsfw: false,
  },
  {
    id: 'consent',
    title: 'Consent & Boundaries',
    desc:
      'Define what’s in/out, safe words, partner permissions, and takedown preferences. Consent isn’t paperwork—it’s culture.',
    href: '/legal',
    cta: 'Consent Guidelines',
    nsfw: false,
  },
  {
    id: 'release',
    title: 'Sign Performer Release',
    desc:
      'A creator-first release so you keep control over distribution and removals. No hidden traps.',
    href: '/legal',
    cta: 'Performer Release',
    nsfw: false,
  },
  {
    id: 'profile',
    title: 'Create Your Profile',
    desc:
      'Add stage name, bio, and links. Share what you stand for and what you’ll be making here.',
    href: '/creator',
    cta: 'Open Creator Portal',
    nsfw: false,
  },
  {
    id: 'branding',
    title: 'Brand Basics',
    desc:
      'Upload a banner, pick accent colors, and add 3–5 sample photos/clips so fans recognize you fast.',
    href: '/learn/guides',
    cta: 'Branding Guides',
    nsfw: false,
  },
  {
    id: 'stream-setup',
    title: 'Streaming Setup',
    desc:
      'Connect your stream keys and test your preview. Keep your first stream short and low-stress.',
    href: '/streaming',
    cta: 'Streaming Tools',
    nsfw: false,
  },
  {
    id: 'first-post',
    title: 'Post Your First Update',
    desc:
      'A quick hello or teaser so your earliest supporters can follow and share your work.',
    href: '/platform',
    cta: 'Platform Overview',
    nsfw: true,
  },
  {
    id: 'earnings',
    title: 'Enable Earnings (Soon)',
    desc:
      'Payouts and perks are coming. We’ll roll this out carefully—no overpromises, just steady progress.',
    href: '/legal',
    cta: 'Monetization Terms',
    nsfw: false,
  },
  {
    id: 'promote',
    title: 'Promote & Grow',
    desc:
      'Grab share links, a QR, and templates. We’ll spotlight ethical creators and community builders.',
    href: '/learn/guides',
    cta: 'Promotion Guides',
    nsfw: false,
  },
];

export default function CreatorOnboardingPage() {
  const [checked, setChecked] = useState({}); // { stepId: true }
  const [ack, setAck] = useState(false); // 18+ acknowledgement banner

  // Load saved progress
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setChecked(parsed.checked || {});
        setAck(Boolean(parsed.ack));
      }
    } catch {}
  }, []);

  // Save progress
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked, ack }));
      }
    } catch {}
  }, [checked, ack]);

  const total = BASE_STEPS.length;
  const done = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const pct = Math.round((done / total) * 100);

  function toggle(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function reset() {
    setChecked({});
    setAck(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <section className="relative mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Creator Onboarding
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            We’re building this with you. Creators are the heart of 3ROTIX: you bring light to people who
            are hurting, lonely, and looking for authentic connection. Our role is to help you deliver your vision—safely, ethically, and without exploitation.
          </p>
        </div>

        {/* 18+ banner */}
        <div
          className={`mb-6 rounded-2xl border ${
            ack ? 'border-white/10 bg-zinc-900/40' : 'border-pink-500/40 bg-pink-500/10'
          } p-4`}
        >
          <div className={`mb-2 h-0.5 w-full bg-gradient-to-r ${ACCENT}`} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/80">
              This onboarding covers adult-topic safety and compliance. You must be 18+ to proceed.
            </p>
            <button
              onClick={() => setAck(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                ack
                  ? 'border border-white/10 bg-white/5 text-white/80 hover:border-white/30'
                  : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-lg shadow-pink-500/10 hover:opacity-95'
              }`}
            >
              {ack ? 'Acknowledged' : 'I’m 18+ — Continue'}
            </button>
          </div>
        </div>

        {/* Why this matters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className={`mb-3 h-0.5 w-full bg-gradient-to-r ${ACCENT} opacity-80`} />
          <h2 className="text-base font-semibold text-white">Why we exist</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
            <li>Creators deserve fair economics, clear consent, and real choices—no lock-ins.</li>
            <li>We’re tired of exploitative platforms and bait-and-switch policies.</li>
            <li>People need art, intimacy, humor, and connection. Your work brings light—our tools should help, not hinder.</li>
          </ul>
          <p className="mt-3 text-xs text-white/50">
            We keep expectations honest. Features below are labeled <span className="text-white/70">Live</span>, <span className="text-white/70">In&nbsp;Progress</span>, or <span className="text-white/70">Soon</span> and may evolve as we ship.
          </p>
        </div>

        {/* Tools: Now & Upcoming */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Tools: Now & Upcoming</h2>
            <span className={`h-0.5 w-20 bg-gradient-to-r ${ACCENT} opacity-80`} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <ToolCard key={t.title} {...t} />
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Your Progress</h2>
              <p className="text-xs text-white/50">
                {done}/{total} steps complete • {pct}%
              </p>
            </div>
            <button
              onClick={reset}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:border-white/30"
              title="Clear saved progress"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full bg-gradient-to-r ${ACCENT}`}
              style={{ width: `${pct}%` }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              role="progressbar"
            />
          </div>
        </div>

        {/* Steps */}
        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BASE_STEPS.map((s, i) => (
            <li key={s.id}>
              <StepCard index={i + 1} step={s} checked={!!checked[s.id]} onToggle={() => toggle(s.id)} />
            </li>
          ))}
        </ol>

        {/* Need help / quick contacts */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HelpCard
            title="Need help?"
            lines={[
              `Email support: ${SUPPORT_EMAIL}`,
              `Talk to Smiley: ${FOUNDER_EMAIL}`,
            ]}
            primary={{
              label: 'Email Support',
              href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[Support] Creator Onboarding — 3ROTIX')}`,
            }}
            secondary={{
              label: 'Email Smiley',
              href: `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent('Creator Onboarding — Quick Chat')}`,
            }}
          />
          <LinksCard />
        </div>

        {/* Small disclaimer */}
        <p className="mt-6 text-center text-xs text-white/40">
          We build in public. Roadmap items may shift as we learn with the community. No dark patterns, no gotchas.
        </p>

        <div className="h-16" />
      </section>
    </main>
  );
}

/* -------- Components -------- */

function ToolCard({ title, status, desc, href }) {
  const badge = {
    live: { label: 'Live', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'in-progress': { label: 'In Progress', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    soon: { label: 'Soon', cls: 'bg-white/10 text-white/70 border-white/20' },
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

function StepCard({ index, step, checked, onToggle }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${ACCENT} opacity-70`} />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-xs text-white/70">
            {index}
          </span>
          <h3 className="text-base font-semibold text-white">{step.title}</h3>
        </div>
        {step.nsfw && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">18+</span>
        )}
      </div>

      <p className="text-sm text-white/70">{step.desc}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={step.href}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 transition hover:border-white/30"
        >
          {step.cta}
        </Link>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 cursor-pointer rounded border-white/20 bg-transparent accent-pink-600"
            aria-label={`Mark ${step.title} complete`}
          />
          Mark complete
        </label>
      </div>
    </div>
  );
}

function HelpCard({ title, lines, primary, secondary }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className={`h-0.5 w-16 bg-gradient-to-r ${ACCENT} opacity-70`} />
      </div>
      <ul className="space-y-1 text-sm text-white/70">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition hover:opacity-95"
        >
          {primary.label}
        </a>
        <a
          href={secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/30"
        >
          {secondary.label}
        </a>
      </div>
    </div>
  );
}

function LinksCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Helpful Links</h3>
        <span className={`h-0.5 w-16 bg-gradient-to-r ${ACCENT} opacity-70`} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Tile href="/creator" title="Creator Portal" desc="Edit profile, uploads, streaming." />
        <Tile href="/legal" title="Legal Hub" desc="TOS, Privacy, DMCA, 2257, Release." />
        <Tile href="/streaming" title="Streaming Tools" desc="Keys, preview, live room." />
        <Tile href="/learn/guides" title="Guides" desc="Shooting, editing, promotion." />
        <Tile href="/support" title="Support" desc="We’re here to help." />
        <Tile href="/platform" title="Platform Overview" desc="What we’re building." />
      </div>
    </div>
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
>>>>>>> fix/supabase-ssr-migration2
