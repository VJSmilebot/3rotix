'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function PrivacyPolicy() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "We respect your privacy and protect your data.",
      content: `
This Privacy Policy explains how 3ROTIX collects, uses, and protects your personal data. 
By using the platform, you consent to these practices.
      `
    },
    {
      id: "data-collection",
      title: "Information We Collect",
      tldr: "We collect what you give us + what’s needed to run the platform.",
      content: `
We may collect:
- Account details (name, email, DOB, ID verification).
- Payment information (processed securely via third-party providers).
- Usage data (logins, interactions, preferences).
- Communications with support or other users.
      `
    },
    {
      id: "use",
      title: "How We Use Your Information",
      tldr: "We use your data to run the platform, improve it, and keep it safe.",
      content: `
We use collected data to:
- Provide and improve services.
- Process payments and subscriptions.
- Enforce policies and protect users.
- Communicate updates, promotions, and support messages.
      `
    },
    {
      id: "sharing",
      title: "Sharing of Information",
      tldr: "We don’t sell your data. We only share when necessary.",
      content: `
We may share information:
- With payment processors to complete transactions.
- With law enforcement if required by law.
- With service providers who support our operations (under strict confidentiality).
We do not sell your personal data to advertisers.
      `
    },
    {
      id: "security",
      title: "Data Security",
      tldr: "We work to protect your info, but nothing is 100% hack-proof.",
      content: `
3ROTIX uses encryption, secure servers, and industry-standard security measures.
However, no online system is completely secure, and we cannot guarantee absolute safety.
      `
    },
    {
      id: "rights",
      title: "Your Rights",
      tldr: "You control your data — access, correct, or delete it anytime.",
      content: `
Depending on your jurisdiction, you may have rights to:
- Access the personal information we hold about you.
- Request corrections or deletion.
- Opt-out of certain communications.
Requests can be made via support@3rotix.com
      `
    },
    {
      id: "retention",
      title: "Data Retention",
      tldr: "We keep data as long as necessary, then delete or anonymize it.",
      content: `
We retain personal information only as long as necessary to fulfill purposes described in this policy or as required by law.
      `
    },
    {
      id: "changes",
      title: "Changes to Policy",
      tldr: "We’ll update this page if anything changes.",
      content: `
3ROTIX may update this Privacy Policy from time to time.
We will notify users of significant changes via email or platform announcements.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Reach out anytime.",
      content: `
For questions about this Privacy Policy, contact: privacy@3rotix.com or support@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-300 mb-2">
          Privacy isn’t a buzzword — it’s the backbone of trust. 
          At 3ROTIX, we treat your personal data with respect, lock it down with security, 
          and never play shady games with your info. This page breaks down exactly what we collect, 
          why we collect it, and how you stay in control.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-privacy.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
        Questions? Reach us at <a href="mailto:privacy@3rotix.com" className="text-pink-400">privacy@3rotix.com</a> 
        or <a href="mailto:support@3rotix.com" className="text-pink-400">support@3rotix.com</a>.
      </footer>
    </main>
  );
}
