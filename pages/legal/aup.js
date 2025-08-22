'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function AcceptableUsePolicy() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "This is the rulebook: what flies on 3ROTIX, and what doesn’t.",
      content: `
This Acceptable Use Policy (AUP) sets the boundaries for how users and creators may interact with 3ROTIX. 
By using the platform, you agree to follow these guidelines to keep our community safe, legal, and respectful.
      `
    },
    {
      id: "lawful",
      title: "Lawful Use Only",
      tldr: "No illegal activity, ever.",
      content: `
You may not use 3ROTIX for unlawful purposes, including fraud, money laundering, sex trafficking, child exploitation, or any other crime.
We will cooperate with law enforcement where required.
      `
    },
    {
      id: "content",
      title: "Prohibited Content",
      tldr: "No minors, no non-consensual, no dangerous or banned content.",
      content: `
Content that is prohibited includes but is not limited to:
- Content involving minors (under 18).
- Non-consensual sexual activity or exploitation.
- Incest, bestiality, extreme violence, or hate content.
- Content that violates 18 U.S.C. §2257 or other record-keeping laws.
      `
    },
    {
      id: "conduct",
      title: "User Conduct",
      tldr: "Respect others — no harassment, threats, or scams.",
      content: `
You may not harass, abuse, or threaten creators or users.
You may not attempt to scam, impersonate, or deceive others.
      `
    },
    {
      id: "security",
      title: "Security Restrictions",
      tldr: "Don’t hack, exploit, or break the platform.",
      content: `
You must not attempt to gain unauthorized access, distribute malware, scrape content, or interfere with 3ROTIX systems.
Violations may result in suspension or termination.
      `
    },
    {
      id: "compliance",
      title: "Compliance & Enforcement",
      tldr: "Break the rules, risk getting banned.",
      content: `
3ROTIX may suspend or terminate any account for violations of this AUP.
Serious violations may be reported to authorities.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Reach out to legal or support.",
      content: `
If you have questions about this Acceptable Use Policy, contact us at:
legal@3rotix.com or support@3rotix.com.
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Acceptable Use Policy</h1>
        <p className="text-gray-300 mb-2">
          Think of this as our community rulebook. We’re not here to kill the vibe — 
          we’re here to protect it. These rules make sure creators stay safe, 
          fans know the boundaries, and 3ROTIX doesn’t end up in legal flames. 
          Read them, respect them, and let’s keep building something wild but safe.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-aup.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
