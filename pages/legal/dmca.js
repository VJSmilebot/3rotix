'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function DMCA() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "We take copyright seriously — here’s how takedowns work.",
      content: `
This DMCA Policy outlines how 3ROTIX responds to copyright infringement notices under the Digital Millennium Copyright Act (DMCA).
If you believe your copyrighted material has been used improperly, follow this process to request removal.
      `
    },
    {
      id: "notice",
      title: "Submitting a DMCA Notice",
      tldr: "If your content was stolen, you can file a notice to have it taken down.",
      content: `
To submit a valid DMCA takedown notice, you must provide:
- Your contact information.
- A description of the copyrighted work.
- The location (URL) of the infringing content.
- A statement under penalty of perjury that you own the copyright or are authorized to act.
- Your signature (electronic or physical).

Notices can be sent to: legal@3rotix.com
      `
    },
    {
      id: "counter",
      title: "Submitting a Counter-Notice",
      tldr: "If you think the takedown was wrong, you can fight it.",
      content: `
If you believe your content was wrongly removed, you may file a counter-notice.
This must include:
- Your contact information.
- Identification of the material removed and its location before removal.
- A statement under penalty of perjury that you believe the takedown was a mistake.
- Consent to the jurisdiction of the courts where you are located.
- Your signature.

Counter-notices can be sent to: legal@3rotix.com
      `
    },
    {
      id: "repeat",
      title: "Repeat Infringers",
      tldr: "If you keep violating copyright, you lose your account.",
      content: `
3ROTIX will terminate accounts of repeat infringers in accordance with the DMCA.
      `
    },
    {
      id: "misuse",
      title: "Misuse of DMCA",
      tldr: "False claims can get you in trouble.",
      content: `
Filing false or abusive DMCA notices is prohibited and may result in liability for damages, including legal fees.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Talk to our legal team.",
      content: `
For questions about this DMCA Policy, contact: legal@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DMCA Policy</h1>
        <p className="text-gray-300 mb-2">
          Creators’ rights matter — period. If your work gets ripped off and re-uploaded without permission, 
          you deserve a clear, fast process to get it taken down. This page lays out how we handle DMCA notices 
          and counter-notices, with transparency and fairness.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-dmca.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
        Questions? Reach us at{" "}
        <a href="mailto:legal@3rotix.com" className="text-pink-400">
          legal@3rotix.com
        </a>.
      </footer>
    </main>
  );
}
