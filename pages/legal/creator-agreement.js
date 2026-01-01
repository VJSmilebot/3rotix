'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function CreatorAgreement() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "This is the deal between you (a creator) and 3ROTIX.",
      content: `
This Creator Agreement governs your ability to monetize on 3ROTIX.
By becoming a creator, you agree to the following terms which outline payments, rights, and responsibilities. 
      `
    },
    {
      id: "eligibility",
      title: "Eligibility & Verification",
      tldr: "You must be 18+ and verify your ID to earn money.",
      content: `
To become a creator, you must be at least eighteen (18) years old and complete our ID verification process.
This may include government-issued identification and proof of consent under 18 U.S.C. §2257.
      `
    },
    {
      id: "ownership",
      title: "Content Ownership",
      tldr: "You own your content, but grant 3ROTIX a license to host and distribute it.",
      content: `
Creators retain ownership of all content uploaded. By uploading, you grant 3ROTIX a worldwide, non-exclusive, royalty-free license 
to host, stream, and display your content for users of the platform.
      `
    },
    {
      id: "payouts",
      title: "Monetization & Payouts",
      tldr: "You earn money from subscribers and tips; we pay you on time.",
      content: `
Creators may monetize through subscriptions, pay-per-view, and tips.
Payouts will be processed on a regular schedule, minus any applicable fees, chargebacks, or taxes.
      `
    },
    {
      id: "fees",
      title: "Platform Fees",
      tldr: "We take a cut; the rest is yours.",
      content: `
3ROTIX may retain a percentage of earnings as a platform fee. 
The current fee structure is disclosed on our support and payout pages, and may change with notice.
      `
    },
    {
      id: "compliance",
      title: "Compliance & Prohibited Content",
      tldr: "Follow the law, respect the guidelines, no illegal or banned content.",
      content: `
Creators must comply with the Acceptable Use Policy, Community Guidelines, and 2257 requirements.
Content involving minors, non-consensual acts, or otherwise unlawful activity is strictly prohibited.
      `
    },
    {
      id: "termination",
      title: "Suspension & Termination",
      tldr: "Break the rules or the law, and your creator privileges can be revoked.",
      content: `
3ROTIX reserves the right to suspend or terminate a creator account at its discretion for violations of this agreement or applicable law.
      `
    },
    {
      id: "law",
      title: "Governing Law & Disputes",
      tldr: "Disputes are handled under applicable law through arbitration.",
      content: `
This agreement is governed by the laws of [Insert Jurisdiction].
All disputes will be handled through binding arbitration, unless otherwise required by law.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Reach out to legal or support.",
      content: `
For questions about this agreement, contact: legal@3rotix.com or support@3rotix.com.
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Creator Agreement</h1>
        <p className="text-gray-300 mb-2">
          This isn’t some faceless contract — it’s the remix of how you and 3ROTIX make money together. 
          Our goal is simple: you own your content, we provide the tools, and together we flip the script on how creators get paid. 
          Read on for the fine print that makes it official.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-creator-agreement.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
            <FaFilePdf /> Download PDF
          </a>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700">
            <FaDownload /> Save as PDF
          </button>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        {/* TOC - Desktop */}
        <aside className="hidden md:block w-1/4 sticky top-24 self-start">
          <h2 className="text-lg font-semibold mb-3">Contents</h2>
          <ul className="space-y-2 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:text-pink-400">{section.title}</a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Sections */}
        <section className="flex-1 space-y-12">
          {sections.map((section, i) => (
            <div key={section.id} id={section.id}>
              {i !== 0 && <hr className="border-pink-500/30 animate-pulse" />}
              <h2 className="text-2xl font-bold mb-2">{section.title}</h2>

              {section.tldr && (
                <div className="bg-pink-500/10 border-l-4 border-pink-500 p-3 rounded mb-3 text-pink-300 text-sm">
                  TL;DR: {section.tldr}
                </div>
              )}

              <p className="text-gray-300 whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Mobile Accordions */}
      <div className="md:hidden mt-12 space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-white/10 rounded-lg">
            <button
              onClick={() => setActive(active === section.id ? null : section.id)}
              className="w-full flex justify-between items-center px-4 py-3 text-left font-semibold"
            >
              {section.title}
              {active === section.id ? <FaArrowUp /> : <FaArrowDown />}
            </button>
            {active === section.id && (
              <div className="p-4">
                {section.tldr && (
                  <div className="bg-pink-500/10 border-l-4 border-pink-500 p-3 rounded mb-3 text-pink-300 text-sm">
                    TL;DR: {section.tldr}
                  </div>
                )}
                <p className="text-gray-300 whitespace-pre-line">{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <footer className="mt-16 text-sm text-gray-400">
        Questions? Reach us at <a href="mailto:legal@3rotix.com" className="text-pink-400">legal@3rotix.com</a> or <a href="mailto:support@3rotix.com" className="text-pink-400">support@3rotix.com</a>.
      </footer>
    </main>
  );
}
