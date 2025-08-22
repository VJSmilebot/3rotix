'use client';
import { useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function CommunityGuidelines() {
  const [active, setActive] = useState(null);

  const sections = [
    {
      id: "age",
      title: "🔞 You Must Be 18+",
      tldr: "Only adults (18+) are allowed on 3ROTIX.",
      content: `
This is a platform for adults. By using 3ROTIX, you confirm that you are 18 or older, 
or the legal age of majority in your country.
      `
    },
    {
      id: "consent",
      title: "❤️ Consent Is Non-Negotiable",
      tldr: "All content must be consensual, verified, and ethical.",
      content: `
All participants must be adults who consented to appear.
- No secretly recorded or revenge-based content.
- No deepfakes or impersonation without permission.
- No coercion. No gray areas.
      `
    },
    {
      id: "allowed",
      title: "🔥 What’s Allowed",
      tldr: "Consensual, legal, creative expression is welcome.",
      content: `
We celebrate freedom of expression and support diverse, sex-positive creators. 
As long as it’s consensual and legal, your creativity is welcome — erotic, artistic, educational, or experimental.
      `
    },
    {
      id: "not-allowed",
      title: "🚫 What’s Not Allowed",
      tldr: "Zero tolerance for illegal or harmful content.",
      content: `
We have zero tolerance for:
- Child sexual abuse material (CSAM) — including simulated, drawn, or AI-generated
- Non-consensual content
- Animal exploitation
- Hate speech or extremist content
- Harassment, blackmail, or doxxing
- Spam, scams, or impersonation
- Any illegal activity

Violation = immediate ban and potential reporting to legal authorities.
      `
    },
    {
      id: "creator-rights",
      title: "🛡️ Creator Rights Matter",
      tldr: "Creators own their work and set their own boundaries.",
      content: `
Creators:
- Own and control their content
- Set their own boundaries
- Can leave at any time
- Deserve to be heard, respected, and credited

Fans must respect creators' work. 3ROTIX has their back.
      `
    },
    {
      id: "blockchain",
      title: "🪙 Blockchain, Tokens, & Rewards",
      tldr: "Web3 perks for verified creators and early adopters.",
      content: `
3ROTIX is integrating NFTs and token-based tools. 
Creators and fans may receive:
- NFT minting perks
- Fan referral bonuses
- Early access features
      `
    },
    {
      id: "innovation",
      title: "🧠 Innovation-Forward",
      tldr: "This is a tech lab for creators.",
      content: `
We test:
- AI tools
- Marketing templates
- Monetization systems
- Creator onboarding systems

Your feedback helps build the future.
      `
    },
    {
      id: "culture",
      title: "📣 Be a Part of the Culture",
      tldr: "Bring good vibes: smart, sexy, weird, real.",
      content: `
We want a space where:
- New creators feel welcome
- Fans contribute positively
- Respect and fun go hand in hand
      `
    },
    {
      id: "reporting",
      title: "🚨 Reporting & Support",
      tldr: "Report sketchy stuff, reach out for help.",
      content: `
See something wrong? Report it.
Need help? Email support@3rotix.com or DM a mod in our Telegram.
      `
    },
    {
      id: "tldr",
      title: "✊ The TL;DR",
      tldr: "Respect creators. Respect yourself. Keep it legal.",
      content: `
Respect creators. Respect yourself. 
Keep it legal. Keep it consensual. 
If you wouldn’t want your actions seen on the blockchain or in public, don’t do them here.
      `
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">
      {/* Title */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">3ROTIX Community Guidelines</h1>
        <p className="text-sm text-gray-500">Last updated: August 2025</p>
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
        Questions? Reach us at <a href="mailto:support@3rotix.com" className="text-pink-400">support@3rotix.com</a>.
      </footer>
    </main>
  );
}
