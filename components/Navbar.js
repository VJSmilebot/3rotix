// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/creator-portal', label: 'Creator Portal' },
    { href: '/education', label: 'Education' },
    { href: '/features', label: 'Features' },
    { href: '/impact', label: 'Impact' },
    { href: '/media', label: 'Media' },
    { href: '/contact', label: 'Contact' },
    { href: '/build', label: 'Build With Us' },
  ];

  return (
    <nav className="bg-black/90 backdrop-blur sticky top-0 z-40 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="3ROTIX" width={40} height={40} className="rounded-full" />
          <span className="text-white font-semibold tracking-wide">3ROTIX</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/creators" style={{ padding: '8px 12px' }}>Creators</Link>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/90 hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-white hover:text-pink-400 text-xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden bg-black/95 border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="block py-2 text-white/90 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
