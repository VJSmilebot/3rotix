'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function PerformerRelease() {
  const [active, setActive] = useState(null);

  const handlePrint = () => window.print();

  const sections = [
    {
      id: "age",
      title: "1. Age Verification & Identity",
      tldr: "All performers must be 18+ with valid ID.",
      content: `
Performer certifies they are 18+ and agrees to provide valid government-issued photo identification upon request 
for compliance with age-verification laws (e.g., 18 U.S.C. §2257 or international equivalents).
      `
    },
    {
      id: "consent",
      title: "2. Consent to Record & Distribute",
      tldr: "Performers willingly consent to filming and distribution.",
      content: `
- Performer consents to be filmed/recorded in adult content.
- Content may be uploaded, monetized, tokenized, or distributed on 3ROTIX and affiliated platforms.
- Performer confirms they were not under duress or influence at the time of recording.
      `
    },
    {
      id: "names",
      title: "3. Performer Names & Aliases",
      tldr: "You can use a stage name or alias.",
      content: `
Performer may use a stage name, alias, or verified identity of their choosing. 
3ROTIX may display this alias publicly unless otherwise directed.
      `
    },
    {
      id: "ip",
      title: "4. Intellectual Property & Rights",
      tldr: "You own your likeness; we get a license to use it.",
      content: `
- Performer retains ownership of their likeness and brand.
- Grants 3ROTIX and uploader a non-exclusive, royalty-free, worldwide license to use and promote the content.
- NFT/token use requires a separate agreement.
      `
    },
    {
      id: "ai",
      title: "5. AI, Biometric & Emerging Tech",
      tldr: "You choose if your likeness is used in AI or avatars.",
      content: `
Performer must explicitly opt in/out of:
- AI-generated voice/face/body
- Training of models on their content
- Motion capture, biometric scans, or avatars
Consent for emerging tech must always be separate.
      `
    },
    {
      id: "waiver",
      title: "6. Legal Waiver & Platform Release",
      tldr: "Performer waives claims against 3ROTIX for content use.",
      content: `
Performer releases 3ROTIX from liability related to:
- Content distribution/exposure
- Monetization (streaming, tokens, NFTs, licensing)
- Remixing within platform guidelines
      `
    },
    {
      id: "safety",
      title: "7. Safety, Ethics & Boundaries",
      tldr: "Zero tolerance for abuse, minors, or coercion.",
      content: `
3ROTIX enforces zero tolerance for:
- Non-consensual acts/threats
- Coercion, trafficking, or abuse
- Minors or animals
Creators must keep signed documentation on file.
      `
    },
    {
      id: "blockchain",
      title: "8. Blockchain & Token Systems",
      tldr: "Tokenized royalties may be public and traceable.",
      content: `
Performers may receive tokenized royalties, NFT earnings, or rewards. Acknowledge:
- Blockchain is public & traceable
- Pseudonymity possible, anonymity not guaranteed
- Smart contracts may include revenue share/vesting
      `
    },
    {
      id: "termination",
      title: "9. Termination",
      tldr: "You can request removal, but blockchain content may persist.",
      content: `
Performer may request content removal/account deletion anytime. 
3ROTIX will comply in good faith, but blockchain content (NFTs, nodes) may not be fully erasable.
      `
    },
    {
      id: "signatures",
      title: "10. Signatures",
      tldr: "Digital signing = legal agreement.",
      content: `
By checking the box or digitally signing during onboarding, Performer agrees to this Agreement.
Signed: [Performer Name/Alias] | Date: [Auto-filled]
Platform Contact: legal@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">3ROTIX Performer Consent & Release Agreement</h1>
        <p className="text-gray-400 text-sm mb-2">Version 1.0 — July 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-release.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
        Questions? Reach us at <a href="mailto:legal@3rotix.com" className="text-pink-400">legal@3rotix.com</a>.
      </footer>
    </main>
  );
}
