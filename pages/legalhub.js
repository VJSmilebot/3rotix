'use client';
import Link from 'next/link';
import { FaScroll, FaUserTie, FaBan, FaCopyright, FaIdBadge, FaLock, FaMoneyBill, FaUsers, FaFileSignature } from 'react-icons/fa';

export default function LegalHub() {
  const platformPolicies = [
    {
      title: 'Terms of Service (Fans & General Users)',
      href: '/legal/terms',
      icon: <FaScroll className="h-6 w-6 text-pink-500" />,
      desc: 'Rules for everyone using the 3ROTIX platform.'
    },
    {
      title: 'Creator Agreement (Monetization Terms)',
      href: '/legal/creator-agreement',
      icon: <FaUserTie className="h-6 w-6 text-pink-500" />,
      desc: 'How creators earn, monetize, and protect their rights.'
    },
    {
      title: 'Acceptable Use Policy (AUP)',
      href: '/legal/aup',
      icon: <FaBan className="h-6 w-6 text-pink-500" />,
      desc: 'What you can and cannot do on 3ROTIX.'
    },
    {
      title: 'DMCA Policy',
      href: '/legal/dmca',
      icon: <FaCopyright className="h-6 w-6 text-pink-500" />,
      desc: 'Copyright protection and takedown process.'
    },
    {
      title: '2257 / ID & Consent Policy',
      href: '/legal/2257',
      icon: <FaIdBadge className="h-6 w-6 text-pink-500" />,
      desc: 'Our compliance with federal record-keeping requirements.'
    },
    {
      title: 'Privacy Policy',
      href: '/legal/privacy',
      icon: <FaLock className="h-6 w-6 text-pink-500" />,
      desc: 'How we handle data, security, and user privacy.'
    },
    {
      title: 'Payments Terms',
      href: '/legal/payments',
      icon: <FaMoneyBill className="h-6 w-6 text-pink-500" />,
      desc: 'Details about payouts, fees, and transactions.'
    },
  ];

  const communityPolicies = [
    {
      title: 'Community Guidelines',
      href: '/legal/guidelines',
      icon: <FaUsers className="h-6 w-6 text-pink-500" />,
      desc: 'The vibe we keep and how we support each other.'
    },
    {
      title: 'Performer Release',
      href: '/legal/release',
      icon: <FaFileSignature className="h-6 w-6 text-pink-500" />,
      desc: 'Consent and legal release for performer content.'
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 text-white">
      {/* Intro */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold mb-4">Legal Hub</h1>
        <p className="text-lg leading-relaxed text-gray-300">
          At 3ROTIX, we believe compliance isn’t just paperwork — it’s survival. The adult industry has long been shadowed by stigma,
          exploitation, and outdated perceptions of creators and sex itself. By making our legal standards public and accessible, we’re
          setting the tone for a different future: one built on transparency, safety, and respect. Our goal isn’t only to protect our
          platform — it’s to help reshape how society views sex, content, and the creators who make it possible.
        </p>
      </section>

      {/* Platform Policies */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Platform Policies</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {platformPolicies.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex items-start gap-4 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition"
            >
              {p.icon}
              <div>
                <h3 className="text-lg font-bold group-hover:text-pink-400">{p.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community & Agreements */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Community & Agreements</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {communityPolicies.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex items-start gap-4 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition"
            >
              {p.icon}
              <div>
                <h3 className="text-lg font-bold group-hover:text-pink-400">{p.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
