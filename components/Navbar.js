'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const NavGroup = ({ label, items, activeDropdown, setActiveDropdown, isMobile, closeMobile }) => {
  const isOpen = activeDropdown === label;
  const ref = useRef(null);

  // close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [isOpen, setActiveDropdown]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setActiveDropdown(isOpen ? null : label)}
        className={`w-full cursor-pointer px-3 py-2 rounded-md hover:bg-white/5 inline-flex items-center gap-1 ${
          isMobile ? 'justify-between text-base font-medium' : ''
        }`}
      >
        {label}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`${
            isMobile
              ? 'pl-3 mt-1 space-y-1'
              : 'absolute left-0 mt-2 min-w-[220px] rounded-lg border border-white/10 bg-neutral-900/95 backdrop-blur shadow-lg p-2 z-50'
          }`}
        >
          {items.map((it) => (
            <Link
              key={it.href + it.label}
              href={it.href}
              className={`block px-3 py-2 rounded-md text-sm hover:bg-white/5 ${
                isMobile ? 'py-2 text-sm opacity-90' : ''
              }`}
              target={it.external ? '_blank' : undefined}
              rel={it.external ? 'noreferrer' : undefined}
              onClick={() => {
                setActiveDropdown(null);
                if (closeMobile) closeMobile();
              }}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const platform = [
    { label: 'Overview', href: '/platform' },
    { label: 'Features', href: '/features' },
    { label: 'Creator Portal', href: '/creator-portal' },
    { label: 'Live Streaming', href: '/streaming' },
    { label: 'Gamification', href: '/gamification' },
    { label: 'Legal Hub', href: '/legalhub' },
  ];

  const learn = [
    { label: 'Education Hub', href: '/education' },
    { label: 'Creator Onboarding', href: '/learn/onboarding' },
    { label: 'Guides & Playbooks', href: '/learn/guides' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  const community = [
    { label: 'Join Telegram', href: 'https://t.co/XAhdPTMnMg', external: true },
    { label: 'Announcements / Blog', href: '/blog' },
    { label: 'Early Access / Waitlist', href: '/waitlist' },
    { label: 'Events & Streams', href: '/events' },
    { label: 'Support', href: '/support' },
  ];

  const company = [
    { label: 'About', href: '/about' },
    { label: 'Impact', href: '/impact' },
    { label: 'Media / Press Kit', href: '/media' },
    { label: 'Contact', href: '/contact' },
    { label: 'Community Guidelines', href: '/legal/guidelines' },
    { label: 'Terms of Service', href: '/legal/tos' },
    { label: 'Performer Release', href: '/legal/release' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-white">
        {/* Left: logo */}
        <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
          <img alt="3ROTIX" src="/logo.png" className="h-7 w-7" />
          <span>3ROTIX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavGroup label="Platform" items={platform} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Learn" items={learn} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Community" items={community} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Company" items={company} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
        </div>

        {/* Right: primary CTA */}
        <div className="hidden md:block">
          <Link
            href="/creator-portal"
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500"
          >
            Creator Portal
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => {
            setOpen((v) => !v);
            setActiveDropdown(null);
          }}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/95 text-white">
          <div className="px-4 py-3 space-y-3">
            <NavGroup
              label="Platform"
              items={platform}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isMobile
              closeMobile={() => setOpen(false)}
            />
            <NavGroup
              label="Learn"
              items={learn}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isMobile
              closeMobile={() => setOpen(false)}
            />
            <NavGroup
              label="Community"
              items={community}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isMobile
              closeMobile={() => setOpen(false)}
            />
            <NavGroup
              label="Company"
              items={company}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              isMobile
              closeMobile={() => setOpen(false)}
            />

            <Link
              href="/creator-portal"
              className="mt-2 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-pink-600 hover:bg-pink-500"
              onClick={() => setOpen(false)}
            >
              Creator Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
