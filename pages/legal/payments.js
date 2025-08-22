'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaFilePdf, FaDownload } from 'react-icons/fa';

export default function PaymentsTerms() {
  const [active, setActive] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      tldr: "Money matters — here’s how payments flow on 3ROTIX.",
      content: `
These Payments Terms explain how transactions are processed between fans, creators, and 3ROTIX. 
By using the platform, you agree to these terms for subscriptions, tips, and other payments.
      `
    },
    {
      id: "methods",
      title: "Payment Methods",
      tldr: "We process payments securely through third-party providers.",
      content: `
Fans may purchase subscriptions, tips, or pay-per-view content using approved payment methods. 
3ROTIX uses third-party payment processors; your payment information is not stored directly on our servers.
      `
    },
    {
      id: "fees",
      title: "Platform Fees",
      tldr: "We take a cut; creators keep the rest.",
      content: `
3ROTIX deducts a platform fee from each transaction. 
The current fee percentage is disclosed on our payout pages and may change with notice.
      `
    },
    {
      id: "payouts",
      title: "Creator Payouts",
      tldr: "Creators get regular payouts of their earnings.",
      content: `
Creators may withdraw earnings subject to minimum thresholds and payout schedules. 
Delays may occur due to verification, fraud checks, or holidays.
      `
    },
    {
      id: "refunds",
      title: "Refunds & Chargebacks",
      tldr: "No guaranteed refunds — chargebacks may impact creators.",
      content: `
All sales are generally final. 
Refunds may be issued only in limited cases of fraud or platform error. 
Chargebacks filed by fans may result in deductions from creator earnings.
      `
    },
    {
      id: "currency",
      title: "Currency & Taxes",
      tldr: "Prices are in USD (unless noted). Taxes are your responsibility.",
      content: `
Transactions are processed in U.S. Dollars unless otherwise stated. 
Creators are responsible for reporting and paying any taxes owed on earnings.
      `
    },
    {
      id: "suspension",
      title: "Account Suspension",
      tldr: "If your account is suspended, pending payouts may be withheld.",
      content: `
3ROTIX may withhold payouts if accounts are suspended due to suspected fraud, chargebacks, or policy violations.
      `
    },
    {
      id: "changes",
      title: "Changes to Terms",
      tldr: "We may update these terms and notify you.",
      content: `
3ROTIX may amend these Payments Terms from time to time. 
Continued use of the platform after updates constitutes acceptance.
      `
    },
    {
      id: "contact",
      title: "Contact Information",
      tldr: "Questions about payments? Reach out.",
      content: `
For payment-related questions, contact: payments@3rotix.com or support@3rotix.com
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Payments Terms</h1>
        <p className="text-gray-300 mb-2">
          Payments are the fuel that keep creators thriving and fans connected. 
          We keep the flow clear, secure, and fair — so you know exactly where your money’s going 
          and how it gets to the people making the magic.
        </p>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
        <div className="flex gap-4 mt-4">
          <a href="/docs/3rotix-payments.pdf" className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
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
        Questions? Reach us at <a href="mailto:payments@3rotix.com" className="text-pink-400">payments@3rotix.com</a> 
        or <a href="mailto:support@3rotix.com" className="text-pink-400">support@3rotix.com</a>.
      </footer>
    </main>
  );
}
