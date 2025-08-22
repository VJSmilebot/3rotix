'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function TermsOfService() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  // Sections of Terms of Service (from Policy Pack PDF)
  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "These are the rules of the road. Respect them, and we’re good.",
      content: `
Welcome to 3ROTIX. By using the platform, you agree to these Terms of Service, which apply to fans, subscribers, and general users.
These terms explain your rights, obligations, and limitations when using 3ROTIX.
      `
    },
    {
      id: "eligibility",
      title: "Eligibility",
      tldr: "You must be 18+ and legally allowed to view adult content.",
      content: `
To use 3ROTIX, you must be at least eighteen (18) years old or the age of majority in your jurisdiction.
By creating an account, you confirm that you meet this requirement and are legally allowed to access adult-oriented content.
      `
    },
    {
      id: "accounts",
      title: "Account Registration & Security",
      tldr: "Use accurate info, keep your password safe, and don’t share accounts.",
      content: `
When you register for an account, you must provide true, accurate, and current information.
You are responsible for maintaining the confidentiality of your login credentials.
You agree to notify us immediately of any unauthorized use of your account.
      `
    },
    {
      id: "conduct",
      title: "User Conduct",
      tldr: "Respect creators, don’t exploit the platform, and keep it legal.",
      content: `
You agree not to use 3ROTIX for any unlawful, harmful, abusive, harassing, defamatory, or otherwise objectionable behavior.
You must not exploit, hack, or misuse the platform or other users.
      `
    },
    {
      id: "content",
      title: "Content & Intellectual Property",
      tldr: "Creators own their content — you get access, not ownership.",
      content: `
All content on 3ROTIX is owned by its creators or licensed to 3ROTIX.
Users may not copy, distribute, or exploit content without permission.
Purchasing or subscribing grants access only, not ownership.
      `
    },
    {
      id: "payments",
      title: "Payments & Subscriptions",
      tldr: "Pay for access, follow billing rules, no chargebacks without cause.",
      content: `
By subscribing or purchasing, you agree to pay all applicable fees.
All sales are final except as required by law.
Unauthorized chargebacks may result in account termination.
      `
    },
    {
      id: "termination",
      title: "Termination",
      tldr: "Break the rules, lose your access. Simple.",
      content: `
3ROTIX may suspend or terminate accounts at any time for violation of these terms, illegal activity, or harm to the community.
      `
    },
    {
      id: "liability",
      title: "Disclaimers & Limitation of Liability",
      tldr: "We run the platform, but we’re not liable for everything on it.",
      content: `
3ROTIX provides the platform “as is” without warranties.
We are not responsible for damages arising from use, access, or inability to access the platform.
      `
    },
    {
      id: "law",
      title: "Governing Law & Dispute Resolution",
      tldr: "Disputes go through arbitration under applicable law.",
      content: `
These Terms are governed by the laws of [Insert Jurisdiction].
Any disputes will be resolved through binding arbitration in accordance with applicable arbitration rules.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions? Hit up our legal or support team.",
      content: `
If you have questions about these Terms, contact us at:
legal@3rotix.com or support@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-300 mb-2">
          Nobody wakes up excited to read Terms of Service — we get it. But these rules matter.
          They’re the rails that keep our playground safe, keep creators in control, and keep fans happy.
          TL;DR: Respect the platform, respect each other, and we’ll keep building something amazing together.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-terms.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
