import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AppShell({ children }) {
  const router = useRouter();
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const navItems = [
    { href: '/homebase', label: 'Homebase', icon: '🏠' },
    { href: '/explore', label: 'Explore', icon: '🔍' },
    { href: '/drops', label: 'Drops', icon: '📸' },
    { href: '/inbox', label: 'Inbox', icon: '💬' },
    { href: '/me', label: 'Me', icon: '👤' },
  ];

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop Left Nav */}
      <nav className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="text-2xl font-bold text-blue-400">
            3ROTIX
          </Link>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setRightDrawerOpen(true)}
            >
              ☰
            </button>

            {/* Logo (mobile) */}
            <Link href="/" className="md:hidden text-xl font-bold text-blue-400">
              3ROTIX
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Action Button */}
            <QuickActionButton />

            {/* Profile Chip */}
            <ProfileChip />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 py-2 flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
              isActive(item.href)
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Right Drawer (placeholder) */}
      {rightDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setRightDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-900 border-l border-gray-800">
            <div className="p-4">
              <button
                onClick={() => setRightDrawerOpen(false)}
                className="text-gray-400 hover:text-white mb-4"
              >
                ✕
              </button>
              {/* Drawer content will go here */}
              <p className="text-gray-400">Right drawer content</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileChip() {
  // Placeholder - will implement with user data
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
        U
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-medium">Username</span>
        <span className="text-xs text-gray-400">Level 5</span>
      </div>
    </div>
  );
}

function QuickActionButton() {
  const [menuOpen, setMenuOpen] = useState(false);

  const actions = [
    { label: 'New Post', icon: '📝', action: () => console.log('New post') },
    { label: 'New Drop', icon: '📸', action: () => console.log('New drop') },
    { label: 'New Message', icon: '💬', action: () => console.log('New message') },
    { label: 'Go Live', icon: '📺', action: () => console.log('Go live') },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-xl font-bold transition-all"
      >
        +
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 min-w-48">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}