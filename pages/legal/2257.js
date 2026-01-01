'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function Policy2257() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "This policy is all about keeping IDs and consent records legit.",
      content: `
This 2257 / ID & Consent Policy explains our compliance with 18 U.S.C. §2257 and related regulations.
It requires that producers of sexually explicit content maintain records confirming that all performers are of legal age 
and have consented to appear in the material.
      `
    },
    {
      id: "records",
      title: "Record-Keeping Requirements",
      tldr: "We keep records of IDs and consent for all performers.",
      content: `
3ROTIX, as a secondary producer, requires that creators provide proper documentation, including:
- A valid government-issued photo ID for each performer.
- A signed consent and model release form.
- Records stored in compliance with 18 U.S.C. §2257.

Failure to provide accurate and complete records may result in account suspension or termination.
      `
    },
    {
      id: "age",
      title: "Age Verification",
      tldr: "All performers must be 18+, verified with government ID.",
      content: `
No content may be uploaded or distributed unless all performers are verified as being at least eighteen (18) years old.
Verification requires a clear, valid government-issued ID and proof of consent.
      `
    },
    {
      id: "custodian",
      title: "Custodian of Records",
      tldr: "We appoint a records custodian to handle compliance.",
      content: `
As required by law, 3ROTIX maintains a designated Custodian of Records who can be contacted for compliance inquiries.
The custodian ensures proper storage and availability of documentation upon legal request.
Contact details: legal@3rotix.com
      `
    },
    {
      id: "compliance",
      title: "Creator Responsibilities",
      tldr: "Creators must submit IDs and releases before content goes live.",
      content: `
Creators are responsible for submitting ID and consent documentation for all performers featured in their content.
3ROTIX will not publish content until proper records are received and verified.
      `
    },
    {
      id: "enforcement",
      title: "Enforcement",
      tldr: "Non-compliance = content takedown or account suspension.",
      content: `
Failure to comply with this policy may result in immediate removal of content, suspension of accounts, and potential legal reporting.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Talk to our compliance team.",
      content: `
For compliance questions under 18 U.S.C. §2257, contact our Custodian of Records at: legal@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">2257 / ID & Consent Policy</h1>
        <p className="text-gray-300 mb-2">
          This is the backbone of keeping our platform safe, legal, and ethical. 
          IDs and signed consents aren’t just paperwork — they’re proof that every performer on 3ROTIX is an adult, 
          empowered, and present by choice. We take this seriously, because protecting creators protects the entire community.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-2257.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
