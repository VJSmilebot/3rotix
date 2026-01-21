'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

/** Dropdown group — unchanged structure/styles */
const NavGroup = ({ label, items, activeDropdown, setActiveDropdown, isMobile, closeMobile }) => {
  const isOpen = activeDropdown === label;
  const ref = useRef(null);

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
                setTimeout(() => {
                  setActiveDropdown(null);
                  if (closeMobile) closeMobile();
                }, 0);
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

function isSafeFromPath(p) {
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');
}

export default function Navbar() {
  const router = useRouter();
  const { user, supabase, ready } = useAuth();

  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Canonical Prisma user (from /api/user/ensure)
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  // Account dropdown (desktop)
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const [loggingOut, setLoggingOut] = useState(false);

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, [accountOpen]);

  // Fetch canonical Prisma user (handle/avatar/role) via ensure
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!ready || !user) {
        if (!cancelled) setMe(null);
        return;
      }
      try {
        if (!cancelled) setLoadingMe(true);

        const res = await fetch('/api/user/ensure', { method: 'POST' });
        const json = await res.json().catch(() => ({}));

        if (!cancelled) {
          if (res.ok && json?.user) setMe(json.user);
          else setMe(null);
        }
      } catch (e) {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const from = useMemo(() => {
    const p = router?.asPath;
    return isSafeFromPath(p) ? p : '/homebase';
  }, [router?.asPath]);

  const accountLabel = useMemo(() => {
    if (!user) return 'Account';
    // Prefer Prisma handle/name
    return (
      me?.handle ||
      me?.name ||
      user?.user_metadata?.handle ||
      user?.user_metadata?.name ||
      (user?.email ? user.email.split('@')[0] : null) ||
      'Account'
    );
  }, [user, me]);

  const accountAvatar = me?.image || null;

  const handleLogout = async () => {
    if (!supabase) return;
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      setLoggingOut(false);
    }
  };

  // Groups (unchanged)
  const platform = [
    { label: 'Overview', href: '/platform' },
    { label: 'Explore Creators', href: '/creators' },
    { label: 'Drops', href: '/bundles' },
    { label: 'Inbox', href: '/messages' },
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
    { label: 'Early Access / Waitlist', href: '/fan-portal' },
    { label: 'Events & Streams', href: '/events' },
    { label: 'Support', href: '/support' },
  ];

  const company = [
    { label: 'About', href: '/about' },
    { label: 'Impact', href: '/impact' },
    { label: 'Media / Press Kit', href: '/media' },
    { label: 'Contact', href: '/contact' },
    { label: 'Community Guidelines', href: '/legal/guidelines' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Performer Release', href: '/legal/release' },
  ];

  const myHandle = me?.handle || null;
  const myProfileHref = myHandle ? `/c/${myHandle}` : '/homebase';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-white">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
          <img alt="3ROTIX" src="/logo.png" className="h-7 w-7" />
          <span>3ROTIX</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <NavGroup label="Platform" items={platform} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Learn" items={learn} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Community" items={community} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          <NavGroup label="Company" items={company} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
        </div>

        {/* Desktop right side: one obvious Account button */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600"
            >
              Login
            </Link>
          ) : (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700 border border-white/10"
                aria-label="Open account menu"
              >
                {accountAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountAvatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10" />
                )}

                <span className="max-w-[140px] truncate">
                  {loadingMe ? 'Loading…' : accountLabel}
                </span>

                {/* 3 lines */}
                <span className="ml-1 inline-flex flex-col justify-center gap-1">
                  <span className="block h-0.5 w-4 bg-white/80" />
                  <span className="block h-0.5 w-4 bg-white/80" />
                  <span className="block h-0.5 w-4 bg-white/80" />
                </span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-900/95 backdrop-blur shadow-lg p-2 z-50">
                  <Link
                    href={myProfileHref}
                    className="block px-3 py-2 rounded-md text-sm hover:bg-white/5"
                    onClick={() => setAccountOpen(false)}
                  >
                    My Profile
                  </Link>

                  <Link
                    href={`/creator?from=${encodeURIComponent(from)}`}
                    className="block px-3 py-2 rounded-md text-sm hover:bg-white/5"
                    onClick={() => setAccountOpen(false)}
                  >
                    Edit Profile
                  </Link>

                  <Link
                    href={`/studio?from=${encodeURIComponent(from)}`}
                    className="block px-3 py-2 rounded-md text-sm hover:bg-white/5"
                    onClick={() => setAccountOpen(false)}
                  >
                    Studio
                  </Link>

                  <Link
                    href={`/settings?from=${encodeURIComponent(from)}`}
                    className="block px-3 py-2 rounded-md text-sm hover:bg-white/5"
                    onClick={() => setAccountOpen(false)}
                  >
                    Settings
                  </Link>

                  <div className="my-2 h-px bg-white/10" />

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    {loggingOut ? 'Logging out…' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile hamburger (site sections). Account actions are shown inside when open */}
        <button
          onClick={() => {
            setOpen((v) => !v);
            setActiveDropdown(null);
          }}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/95 text-white">
          <div className="px-4 py-3 space-y-3">
            <NavGroup label="Platform" items={platform} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} isMobile closeMobile={() => setOpen(false)} />
            <NavGroup label="Learn" items={learn} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} isMobile closeMobile={() => setOpen(false)} />
            <NavGroup label="Community" items={community} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} isMobile closeMobile={() => setOpen(false)} />
            <NavGroup label="Company" items={company} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} isMobile closeMobile={() => setOpen(false)} />

            {/* Mobile account section */}
            {!user ? (
              <Link
                href="/login"
                className="mt-2 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="rounded-xl border border-white/10 bg-neutral-900/60 p-3 flex items-center gap-3">
                  {accountAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={accountAvatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {loadingMe ? 'Loading…' : accountLabel}
                    </div>
                    <div className="text-xs text-white/60 truncate">{user.email}</div>
                  </div>
                </div>

                <Link
                  href={myProfileHref}
                  className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  My Profile
                </Link>

                <Link
                  href={`/creator?from=${encodeURIComponent(from)}`}
                  className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Edit Profile
                </Link>

                <Link
                  href={`/studio?from=${encodeURIComponent(from)}`}
                  className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Studio
                </Link>

                <Link
                  href={`/settings?from=${encodeURIComponent(from)}`}
                  className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>

                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  disabled={loggingOut}
                  className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
