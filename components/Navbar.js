// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-pink-600 px-6 py-4 flex items-center justify-between text-white h-16 relative">
      {/* Left: Logo */}
      <div className="flex-shrink-0">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="3ROTIX Logo"
            width={64}
            height={64}
            className="rounded-full"
          />
        </Link>
      </div>

      {/* Center: Nav Links */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-6 text-lg leading-none">
        <Link href="/"><span>Home</span></Link>
        <Link href="/about"><span>About</span></Link>
        <Link href="/creator-portal"><span>Creator Portal</span></Link>
        <Link href="/education"><span>Education</span></Link>
        <Link href="/features"><span>Features</span></Link>
        <Link href="/impact"><span>Impact</span></Link>
        <Link href="/media"><span>Media</span></Link>
        <Link href="/contact"><span>Contact</span></Link>
      </div>
    </nav>
  );
}
