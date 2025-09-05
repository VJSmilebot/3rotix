import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * 3ROTIX Blog – Pages Router (MVP)
 * - Dark, neon-accent list
 * - Search + tag filters
 * - One-time 18+ interstitial (localStorage)
 * - Zero external deps
 *
 * You can convert to MDX later without changing this page’s UI.
 */

// ---------- Config ----------
const ACCENT = 'from-pink-500 to-fuchsia-500';
const AGE_KEY = 'blog_age_confirmed';

// Seed posts (swap these out later)
const POSTS = [
  {
    id: 'why-3rotix',
    title: 'Why 3ROTIX Exists: Creator-First, Zero Exploitation',
    date: '2025-08-28',
    summary:
      'Our mission in one read: fair economics, consent-by-design, and tools that actually help you build.',
    tags: ['mission', 'ethics', 'creators'],
    nsfw: false,
  },
  {
    id: 'streaming-stack',
    title: 'Streaming That Doesn’t Screw You: Our Live Stack',
    date: '2025-08-22',
    summary:
      'How we’re building a creator-first streaming pipeline using modern infra and sensible guardrails.',
    tags: ['streaming', 'live', 'infra'],
    nsfw: false,
  },
  {
    id: 'gamified-love',
    title: 'Gamified Love: XP, Perks, and Status (Without Paywalls)',
    date: '2025-08-15',
    summary:
      'Fans earn recognition; creators grow communities. A humane take on gamification.',
    tags: ['gamification', 'community'],
    nsfw: false,
  },
  {
    id: 'safety-first',
    title: 'Safety First: Consent, 2257, and Real-World Protections',
    date: '2025-08-10',
    summary:
      'The boring-but-critical stuff: compliance, consent flows, and performer protections we actually enforce.',
    tags: ['safety', 'legal', '2257'],
    nsfw: true,
  },
  {
    id: 'roadmap-90',
    title: 'Roadmap: The Next 90 Days',
    date: '2025-09-01',
    summary:
      'What we’re shipping next across streaming, profiles, and creator tools—with zero fluff.',
    tags: ['roadmap', 'updates'],
    nsfw: false,
  },
];

// ---------- UI Bits ----------
function TagChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm transition
        ${active
          ? 'border-pink-500 bg-pink-500/10 text-pink-300'
          : 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'}
      `}
      aria-pressed={active}
    >
      #{label}
    </button>
  );
}

function PostCard({ post }) {
  const isNew = (() => {
    const now = new Date();
    const d = new Date(post.date);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 14; // new if within 14 days
  })();

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10"
      aria-labelledby={`post-${post.id}`}
    >
      {/* Accent bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${ACCENT} opacity-70`} />

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <h3 id={`post-${post.id}`} className="text-lg font-semibold text-white">
          {post.title}
        </h3>
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
              New
            </span>
          )}
          {post.nsfw && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
              18+
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-white/70">{post.summary}</p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <time className="text-xs text-white/50">
          {new Date(post.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })}
        </time>
        <span className="text-white/20">•</span>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* CTA row: detail pages coming soon */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-white/40">Detail page coming soon</span>
        <button
          disabled
          className="cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/40"
          title="Post pages are coming soon."
        >
          Read
        </button>
      </div>
    </article>
  );
}

// ---------- Page ----------
export default function BlogPage() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [gateOpen, setGateOpen] = useState(false);

  // One-time 18+ interstitial
  useEffect(() => {
    try {
      const ok = typeof window !== 'undefined' && localStorage.getItem(AGE_KEY) === 'true';
      setGateOpen(!ok);
    } catch {
      setGateOpen(true);
    }
  }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    POSTS.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return ['all', ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return POSTS
      .filter((p) => (activeTag === 'all' ? true : p.tags.includes(activeTag)))
      .filter((p) => {
        if (!q) return true;
        const hay = (p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [query, activeTag]);

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            3ROTIX Blog
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Creator-first updates, guides, and unapologetic takes. We build in public—ethically, sex-positive, anti-exploitation.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Search posts</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, tags, or topics…"
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-pink-500/50"
              aria-label="Search posts"
            />
            {/* underline accent */}
            <span
              className={`pointer-events-none absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r ${ACCENT} opacity-30`}
            />
          </label>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <TagChip
                key={t}
                label={t}
                active={activeTag === t}
                onClick={() => setActiveTag(t)}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/10 p-8 text-center text-white/50">
              No posts match your search. Try a different tag or keyword.
            </div>
          ) : (
            filtered.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        {/* Footer strip with safe internal links */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="text-xs text-white/50">
            Built for creators. Be kind, be legal, be ethical.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/legal" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/30">
              Legal Hub
            </Link>
            <Link href="/platform" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/30">
              Platform Overview
            </Link>
            <Link href="/support" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/30">
              Contact / Support
            </Link>
          </div>
        </div>

        <div className="h-16" />
      </section>

      {/* 18+ Interstitial */}
      {gateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className={`h-1 w-full bg-gradient-to-r ${ACCENT}`} />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white">Adult Content Notice</h2>
              <p className="mt-2 text-sm text-white/70">
                Some posts discuss adult topics intended for audiences 18+. By continuing, you confirm that you are at least 18 years old.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    // Send user somewhere safer on “Leave”
                    if (typeof window !== 'undefined') window.location.href = '/';
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:border-white/30"
                >
                  Leave
                </button>
                <button
                  onClick={() => {
                    try {
                      if (typeof window !== 'undefined') localStorage.setItem(AGE_KEY, 'true');
                    } catch {}
                    setGateOpen(false);
                  }}
                  className="rounded-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 hover:opacity-95"
                >
                  I am 18+
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
