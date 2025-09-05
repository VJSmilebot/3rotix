import { useMemo, useState } from 'react';
import Link from 'next/link';

const ACCENT = 'from-pink-500 to-fuchsia-500';

const TOPICS = [
  { value: 'Account/Login', label: 'Account / Login' },
  { value: 'Creator Onboarding', label: 'Creator Onboarding' },
  { value: 'Streaming', label: 'Streaming (Livepeer)' },
  { value: 'Payments/Monetization', label: 'Payments / Monetization' },
  { value: 'Bug Report', label: 'Bug Report' },
  { value: 'Safety Concern', label: 'Safety Concern (Urgent)' },
  { value: 'DMCA/Takedown', label: 'DMCA / Takedown (Urgent)' },
  { value: 'General Question', label: 'General Question' },
];

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Question');
  const [message, setMessage] = useState('');

  const isUrgent = topic === 'DMCA/Takedown' || topic === 'Safety Concern';
  const charCount = message.length;
  const charSoftLimit = 1200;

  const subject = useMemo(() => {
    const tag = isUrgent ? '[URGENT]' : '[Support]';
    return `${tag} ${topic} — 3ROTIX`;
  }, [topic, isUrgent]);

  const body = useMemo(() => {
    const lines = [
      `Name: ${name || '(not provided)'}`,
      `Email: ${email || '(not provided)'}`,
      `Topic: ${topic}`,
      '',
      'Message:',
      message || '(no message)',
      '',
      '—',
      'Sent from 3ROTIX Support page',
    ];
    return encodeURIComponent(lines.join('\n'));
  }, [name, email, topic, message]);

  const mailtoHref = `mailto:support@3rotix.com?subject=${encodeURIComponent(subject)}&body=${body}`;

  function handleSubmit(e) {
    e.preventDefault();
    try {
      // Trigger default mail client
      if (typeof window !== 'undefined') {
        window.location.href = mailtoHref;
      }
    } catch {
      // graceful no-op
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <section className="relative mx-auto w-full max-w-5xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Support & Contact
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Need help or want to reach the team? Use the form or email us. We’re building this in public—ethically, creator-first, and responsive as we scale.
          </p>
        </div>

        {/* Quick contact cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card>
            <CardTitle>General Support</CardTitle>
            <p className="text-sm text-white/70">
              Email <a className="underline-offset-2 hover:underline" href="mailto:support@3rotix.com" target="_blank" rel="noopener noreferrer">support@3rotix.com</a>
            </p>
            <div className="mt-3">
              <AccentButton as="a" href="mailto:support@3rotix.com" target="_blank" rel="noopener noreferrer">
                Email Support
              </AccentButton>
            </div>
          </Card>

          <Card>
            <CardTitle>Talk to Smiley</CardTitle>
            <p className="text-sm text-white/70">
              Founder chat: <a className="underline-offset-2 hover:underline" href="mailto:smiley@3rotix.com" target="_blank" rel="noopener noreferrer">smiley@3rotix.com</a>
            </p>
            <div className="mt-3">
              <GhostButton as="a" href="mailto:smiley@3rotix.com" target="_blank" rel="noopener noreferrer">
                Email Smiley
              </GhostButton>
            </div>
          </Card>
        </div>

        {/* Urgent banner */}
        <div className={`mt-6 overflow-hidden rounded-2xl border ${isUrgent ? 'border-red-500/40 bg-red-500/10' : 'border-white/10 bg-zinc-900/40'} p-4`}>
          <div className={`mb-2 h-0.5 w-full bg-gradient-to-r ${isUrgent ? 'from-red-500 to-rose-500' : ACCENT}`} />
          <p className="text-sm text-white/80">
            {isUrgent ? (
              <>
                <strong className="text-red-300">Urgent selected:</strong> for <em>Safety</em> or <em>DMCA</em>, email{' '}
                <a className="underline-offset-2 hover:underline" href={`mailto:support@3rotix.com?subject=${encodeURIComponent('[URGENT] ' + topic + ' — 3ROTIX')}`} target="_blank" rel="noopener noreferrer">
                  support@3rotix.com
                </a>{' '}
                with “URGENT” in the subject. We prioritize these.
              </>
            ) : (
              <>Choose a topic that best fits your request. For urgent Safety or DMCA issues, select the matching category.</>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="input"
                type="text"
                autoComplete="name"
              />
            </Field>
            <Field label="Your Email" required>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                type="email"
                autoComplete="email"
                required
              />
            </Field>
          </div>

          <Field label="Topic" required>
            <div className="relative">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input appearance-none pr-10"
                required
                aria-label="Choose a support topic"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">▾</span>
            </div>
          </Field>

          <Field label="Message" required hint="Don’t include passwords or sensitive personal info.">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What’s going on? The clearer you can be, the faster we can help."
              className="input min-h-[140px]"
              maxLength={3000}
              required
            />
            <div className="mt-1 text-right text-xs">
              <span className={charCount > charSoftLimit ? 'text-red-300' : 'text-white/40'}>
                {charCount}/{3000}
              </span>
            </div>
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/50">
              Submitting opens your email client with the details prefilled to <span className="text-white/80">support@3rotix.com</span>.
            </p>
            <AccentButton type="submit">Send via Email</AccentButton>
          </div>
        </form>

        {/* Helpful links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Helpful Links</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <LinkTile href="/faq" title="FAQ" desc="Pre-launch answers that evolve as we ship." />
            <LinkTile href="/legal" title="Legal Hub" desc="TOS, Privacy, DMCA, 2257, Community Guidelines." />
            <LinkTile href="/creator" title="Creator Portal" desc="Onboarding, tools, and updates for creators." />
            <LinkTile href="/fan" title="Join as Fan" desc="Follow, support, and earn perks ethically." />
            <LinkTile href="/streaming" title="Streaming" desc="Live tools and viewer experience." />
            <LinkTile href="/learn/guides" title="Guides" desc="How-tos for shooting, editing, and brand-building." />
            <LinkTile href="/gamification" title="Gamification" desc="XP, perks, leaderboards—the fun bits." />
            <LinkTile href="/events" title="Events & Calendar" desc="Where we’re streaming and showing up next." />
            <LinkTile href="/platform" title="Platform Overview" desc="What we’re building and why." />
          </div>
        </div>

        <div className="h-16" />
      </section>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(24, 24, 27, 0.6); /* zinc-900/60 */
          padding: 0.75rem 0.875rem;
          color: white;
          outline: none;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .input:focus {
          border-color: rgba(236, 72, 153, 0.5); /* pink-500/50 */
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
        }
      `}</style>
    </main>
  );
}

/* ---------- Small UI helpers (no extra deps) ---------- */

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10">
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-base font-semibold text-white">{children}</h3>
      <span className={`h-0.5 w-16 bg-gradient-to-r ${ACCENT} opacity-70`} />
    </div>
  );
}

function AccentButton({ as: As = 'button', children, ...props }) {
  return (
    <As
      {...props}
      className="rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition hover:opacity-95"
    >
      {children}
    </As>
  );
}

function GhostButton({ as: As = 'button', children, ...props }) {
  return (
    <As
      {...props}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/30"
    >
      {children}
    </As>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-white">{label}</span>
        {required && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">Required</span>}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </label>
  );
}

function LinkTile({ href, title, desc }) {
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
