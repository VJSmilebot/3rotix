// pages/faq.js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const LAST_UPDATED = 'September 1, 2025';

const faqs = [
  {
    id: 'what-is-3rotix',
    q: 'What is 3ROTIX?',
    a: `A creator-first platform for ethical adult content and community. We’re focused on fair tools, safety, and clean UX — not exploitation.`,
  },
  {
    id: 'who-is-it-for',
    q: 'Who is 3ROTIX for?',
    a: `Creators who want control and transparent policies, and fans who want to support them directly.`,
  },
  {
    id: 'adult-content',
    q: 'Is adult content allowed?',
    a: `Yes — 18+ only, consensual, and within our Community Guidelines. Compliance and documentation are required.`,
  },
  {
    id: 'whats-available-now',
    q: 'What’s available right now?',
    a: `Pre-launch onboarding, early creator profiles, and limited live tests. We’re opening more features in waves as we scale.`,
  },
  {
    id: 'rules-and-policies',
    q: 'Where can I read the rules?',
    a: `See the Legal Hub: Terms of Service, Community Guidelines, Privacy, DMCA, and 2257 info.`,
  },
  {
    id: 'pricing',
    q: 'How much does it cost?',
    a: `Transparent pricing will be announced before public launch.`,
  },
  {
    id: 'creator-signup',
    q: 'How do I sign up as a creator?',
    a: `Go to the Creator Portal and apply. You’ll complete age/ID verification and agree to our policies. Approvals are rolling during pre-launch.`,
  },
  {
    id: 'creator-prelaunch',
    q: 'What can I do once approved (pre-launch)?',
    a: `Set up your profile and get early access to features as we enable them (e.g., posts, live tests, members-only access). Availability may vary while we test.`,
  },
  {
    id: 'planned-tools',
    q: 'What tools are planned?',
    a: `Streaming, posts, tips/subscriptions, members-only access, messaging tools, and basic analytics — designed for clarity and safety. Timelines may change as we test.`,
  },
  {
    id: 'streaming-gear',
    q: 'Do I need specific equipment to stream?',
    a: `A stable connection and a modern browser are usually enough; we’ll publish simple setup guides.`,
  },
  {
    id: 'fan-signup',
    q: 'How do I sign up as a fan?',
    a: `Join the waitlist now. Public accounts will open in phases.`,
  },
  {
    id: 'fan-can-do',
    q: 'What can I do on 3ROTIX as a fan?',
    a: `Follow creators, watch scheduled streams or premieres, and access members-only content when offered. More options roll out over time.`,
  },
  {
    id: 'privacy',
    q: 'Is my privacy protected?',
    a: `We prioritize privacy and clear controls. See our Privacy Policy for details.`,
  },
  {
    id: 'reports-takedowns',
    q: 'How do you handle reports or takedowns?',
    a: `We act quickly on policy violations and DMCA requests. Use in-product reporting or contact Support.`,
  },
  {
    id: 'help',
    q: 'Where do I get help?',
    a: `Check the Support page for guides or open a ticket. During pre-launch, response times may be faster for onboarded creators.`,
  },
  {
    id: 'collabs-docs',
    q: 'I collaborate with other performers — what documentation is required?',
    a: `Everyone appearing must be 18+ and documented. We provide guidance for 2257 records and performer releases.`,
  },
];

function CopyAnchorButton({ id }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/faq#${id}`
        : `#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  };
  return (
    <button
      onClick={onCopy}
      className="ml-2 text-xs rounded px-2 py-1 border border-pink-500/40 text-pink-300 hover:bg-pink-500/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
      aria-label="Copy link to this question"
      title="Copy link"
      type="button"
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export default function FAQ() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <Head>
        <title>3ROTIX — FAQ (Pre-Launch)</title>
        <meta
          name="description"
          content="Pre-launch FAQ for 3ROTIX: what we’re building, how to apply as a creator, how fans can join, safety, privacy, and support."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <section className="mx-auto max-w-3xl px-5 sm:px-6 md:px-8 pt-14 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-neutral-300 leading-relaxed">
            <span className="font-semibold text-pink-400">Pre-launch:</span>{' '}
            3ROTIX is in early testing. This FAQ reflects what’s live now and
            what we’re exploring. Expect updates as we roll features out in
            phases.{' '}
            <span className="block mt-2 text-sm text-neutral-400">
              Last updated: {LAST_UPDATED}
            </span>
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-5 sm:px-6 md:px-8 pb-14">
          <div className="space-y-3">
            {faqs.map(({ id, q, a }) => (
              <details
                key={id}
                id={id}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm"
              >
                <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 sm:px-5 py-4 sm:py-5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-semibold">
                      {q}
                    </h2>
                  </div>
                  <div className="shrink-0 rounded-full border border-neutral-700 p-1 transition-transform group-open:rotate-45">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v14m7-7H5"
                      />
                    </svg>
                  </div>
                </summary>

                <div className="px-4 sm:px-5 pb-5 sm:pb-6">
                  <p className="text-neutral-300 leading-relaxed">
                    {a}
                  </p>
                  <div className="mt-3">
                    <CopyAnchorButton id={id} />
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-10 border-t border-neutral-800 pt-8">
            <h3 className="text-lg font-semibold mb-4">
              Next steps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/legal" legacyBehavior>
                <a className="rounded-xl border border-pink-500/40 bg-neutral-900/70 px-4 py-3 text-center font-medium hover:bg-neutral-900 hover:shadow-[0_0_0_2px_rgba(236,72,153,0.25)] focus:outline-none focus:ring-2 focus:ring-pink-500/60">
                  Legal Hub
                </a>
              </Link>
              <Link href="/creator-portal" legacyBehavior>
                <a className="rounded-xl border border-pink-500/40 bg-neutral-900/70 px-4 py-3 text-center font-medium hover:bg-neutral-900 hover:shadow-[0_0_0_2px_rgba(236,72,153,0.25)] focus:outline-none focus:ring-2 focus:ring-pink-500/60">
                  Creator Portal
                </a>
              </Link>
              <Link href="/waitlist" legacyBehavior>
                <a className="rounded-xl border border-pink-500/40 bg-neutral-900/70 px-4 py-3 text-center font-medium hover:bg-neutral-900 hover:shadow-[0_0_0_2px_rgba(236,72,153,0.25)] focus:outline-none focus:ring-2 focus:ring-pink-500/60">
                  Join as Fan
                </a>
              </Link>
              <Link href="/contact" legacyBehavior>
                <a className="rounded-xl border border-pink-500/40 bg-neutral-900/70 px-4 py-3 text-center font-medium hover:bg-neutral-900 hover:shadow-[0_0_0_2px_rgba(236,72,153,0.25)] focus:outline-none focus:ring-2 focus:ring-pink-500/60">
                  Contact
                </a>
              </Link>
            </div>
            <p className="mt-4 text-sm text-neutral-400">
              Note: Features and timelines may change during pre-launch. We’ll update this page as things evolve.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
