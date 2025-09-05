<<<<<<< HEAD
export default function Placeholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1>🚧 This page is under construction 🚧</h1>
    </div>
  );
}
=======
// pages/guides.js
// Simple, single-file page that lists guides in
// title / one-line summary / tags / link format with a basic tag filter.
// Dark UI with neon pink accents to match 3ROTIX vibes.

import { useMemo, useState } from 'react';

const GUIDES = [
  {
    title: "Create a Safe Streaming Space",
    summary: "Boundaries, moderation, and positive vibes while you go live.",
    url: "https://creators.instagram.com/lab/create-safe-space-environment?locale=en_US",
    tags: ["streaming", "safety", "community", "beginner"],
  },
  {
    title: "Privacy Basics for Creators",
    summary: "Simple steps to protect identity and devices before you publish.",
    url: "https://www.privacyguides.org/en/",
    tags: ["privacy", "security", "beginner"],
  },
  {
    title: "Cybersecurity Tips for Digital Creators",
    summary: "Passwords, 2FA, access control, and safe file storage 101.",
    url: "https://www.cm-alliance.com/cybersecurity-blog/7-cybersecurity-tips-for-digital-creators-to-protect-their-content",
    tags: ["security", "ops", "beginner"],
  },
  {
    title: "Video Basics: Pre‑Production to Strategy",
    summary: "Understand pre‑production, production, and post as one clean pipeline.",
    url: "https://www.firework.com/blog/the-ultimate-video-production-guide",
    tags: ["planning", "workflow", "video"],
  },
  {
    title: "Cornell: Pre‑Production & Shot Fundamentals",
    summary: "Script, storyboard, shot sizes, angles, and camera moves.",
    url: "https://guides.library.cornell.edu/videobasics/preproduction",
    tags: ["planning", "storyboarding", "video", "beginner"],
  },
  {
    title: "Storyboard Primer",
    summary: "Make visual blueprints so your shoot stays focused and fast.",
    url: "https://en.wikipedia.org/wiki/Storyboard",
    tags: ["planning", "storyboarding"],
  },
  {
    title: "Videography Basics for Beginners",
    summary: "Composition, exposure, frame rate, movement, and light that flatters.",
    url: "https://motioncue.com/videography-basics-for-beginners/",
    tags: ["shooting", "lighting", "camera", "beginner"],
  },
  {
    title: "Top 10 Videography Tips",
    summary: "Stabilize, avoid over‑zoom, let shots breathe, and record clean.",
    url: "https://www.desktop-documentaries.com/videography-tips.html",
    tags: ["shooting", "camera", "beginner"],
  },
  {
    title: "Basic Camera Settings for Video",
    summary: "FPS, shutter = 2×fps, aperture for depth, ISO for mood.",
    url: "https://kelliwhitephotography.com/journal/2023/08/01/basic-camera-settings-for-shooting-video/",
    tags: ["shooting", "camera", "settings"],
  },
  {
    title: "Teen Vogue x Vimeo: Easy Video Tips",
    summary: "Phone-friendly framing, natural light, clear audio, quick pacing.",
    url: "https://www.teenvogue.com/story/video-making-tips-vimeo",
    tags: ["shooting", "lighting", "audio", "beginner"],
  },
  {
    title: "Ethical Content Creation Principles",
    summary: "Consent, fair pay, dignity, and transparent collaboration.",
    url: "https://mor10.com/code-of-ethics-for-bloggers-social-media-and-content-creators/",
    tags: ["ethics", "production", "brand"],
  },
  {
    title: "Geo‑Privacy for Images",
    summary: "Avoid accidental location leaks from photos and backgrounds.",
    url: "https://arxiv.org/abs/1603.01335",
    tags: ["privacy", "shooting", "ops"],
  },
  {
    title: "Website Security Basics",
    summary: "Lock down your site: updates, backups, hardening, and least‑privilege.",
    url: "https://www.learningrevolution.net/website-security-tips/",
    tags: ["security", "ops", "web"],
  },
  {
    title: "Plan a Shoot: 15‑Step Checklist",
    summary: "Define goal, outline, logistics, crew, gear, and timing before rolling.",
    url: "https://quickframe.com/blog/video-production-planning-checklist/",
    tags: ["planning", "workflow", "checklist"],
  },
  {
    title: "Creator Safety & Boundaries",
    summary: "Respectful blocking, reporting, and mental health guardrails.",
    url: "https://creators.instagram.com/lab/create-safe-space-environment?locale=en_US",
    tags: ["safety", "community", "ops"],
  },
  {
    title: "Positive Brand Strategy Basics",
    summary: "Voice, values, visuals: build a brand that protects your energy.",
    url: "https://www.canva.com/learn/brand-strategy/",
    tags: ["brand", "strategy", "beginner"],
  },
  {
    title: "Social Campaigns that Don’t Burn You Out",
    summary: "Batch content, schedule wisely, and keep messaging consistent.",
    url: "https://buffer.com/library/social-media-campaigns/",
    tags: ["social", "growth", "workflow"],
  },
  {
    title: "Editing 101: Clean Cuts & Sound",
    summary: "Tell a clear story: trim tight, match on action, level your audio.",
    url: "https://www.nyfa.edu/student-resources/film-editing-techniques/",
    tags: ["editing", "video", "audio", "beginner"],
  },
  {
    title: "Protecting Identity as a Creator",
    summary: "Compartmentalize devices, use aliases, and control metadata.",
    url: "https://www.wired.com/story/the-wired-guide-to-protecting-yourself-from-government-surveillance/",
    tags: ["privacy", "security", "ops"],
  },
  {
    title: "Ethical Production in Adult Spaces (Contextual Reading)",
    summary: "Spot ethical signals: consent, agency, diversity, fair pay.",
    url: "https://www.them.us/story/how-to-find-ethical-pro-sex-work-diverse-queer-porn",
    tags: ["ethics", "production", "context"],
  },
];

function Tag({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border transition-all text-sm mr-2 mb-2 ${
        active
          ? "bg-pink-600/90 border-pink-400 text-white shadow"
          : "bg-black/40 border-pink-500/40 text-pink-200 hover:bg-pink-600/30"
      }`}
    >
      {label}
    </button>
  );
}

function GuideCard({ guide }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-white/95 leading-snug">
          <a href={guide.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {guide.title}
          </a>
        </h3>
        <a
          href={guide.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-300 text-sm shrink-0 hover:text-pink-200"
          aria-label="Open resource in new tab"
        >
          ↗
        </a>
      </div>
      <p className="mt-1 text-white/70 text-sm">{guide.summary}</p>
      <div className="mt-3 flex flex-wrap">
        {guide.tags.map((t) => (
          <span key={t} className="text-xs mr-2 mb-2 px-2 py-0.5 rounded-full bg-pink-600/20 text-pink-200 border border-pink-400/30">
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GuidesPage() {
  const [activeTag, setActiveTag] = useState(null);

  const allTags = useMemo(() => {
    const set = new Set();
    GUIDES.forEach((g) => g.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    if (!activeTag) return GUIDES;
    return GUIDES.filter((g) => g.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-white">3ROTIX</span>{' '}
            <span className="text-pink-500">Guides Hub</span>
          </h1>
          <p className="mt-2 text-white/70 max-w-2xl">
            Short, SFW resources for creators. Filter by a tag to zero in.
          </p>
        </header>

        {/* Tag Filter */}
        <section className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap items-center">
              <Tag label={activeTag ? `Clear: #${activeTag}` : "All tags"} active={!!activeTag} onClick={() => setActiveTag(null)} />
              {allTags.map((t) => (
                <Tag key={t} label={t} active={activeTag === t} onClick={() => setActiveTag(t)} />
              ))}
            </div>
          </div>
        </section>

        {/* Guides List */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <GuideCard key={g.title} guide={g} />
          ))}
        </section>

        {/* Footer hint */}
        <footer className="mt-10 text-center text-xs text-white/50">
          Want to see more guides? Let us know!
        </footer>
      </div>
    </main>
  );
}
>>>>>>> fix/supabase-ssr-migration2
