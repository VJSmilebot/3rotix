// components/Footer.js
import { FaTwitter, FaTelegramPlane, FaInstagram, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <>
      {/* Full Footer (Professional Section) */}
      <footer className="bg-black text-gray-400 border-t border-gray-700 pt-10 pb-20"> 
        {/* pb-20 ensures content is not hidden under fixed mini-bar */}
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1 - Information */}
          <div>
            <h4 className="text-white font-semibold mb-3">Information</h4>
            <ul className="space-y-2">
              <li><a href="/legal/terms" className="hover:text-pink-500">Terms of Service</a></li>
              <li><a href="/legal/privacy" className="hover:text-pink-500">Privacy Policy</a></li>
              <li><a href="/legal/aup" className="hover:text-pink-500">Acceptable Use Policy</a></li>
              <li><a href="/legal/dmca" className="hover:text-pink-500">DMCA Policy</a></li>
              <li><a href="/legal/2257" className="hover:text-pink-500">2257 Compliance</a></li>
              <li><a href="/legal/payments" className="hover:text-pink-500">Payments Terms</a></li>
            </ul>
          </div>

          {/* Column 2 - For Creators */}
          <div>
            <h4 className="text-white font-semibold mb-3">For Creators</h4>
            <ul className="space-y-2">
              <li><a href="/creator-portal" className="hover:text-pink-500">Creator Portal</a></li>
              <li><a href="/legal/creator-agreement" className="hover:text-pink-500">Creator Agreement</a></li>
              <li><a href="/support" className="hover:text-pink-500">Support & Safety</a></li>
              <li><a href="/learn/onboarding" className="hover:text-pink-500">Onboarding</a></li>
            </ul>
          </div>

          {/* Column 3 - Community */}
          <div>
            <h4 className="text-white font-semibold mb-3">Community</h4>
            <ul className="space-y-2">
              <li><a href="https://t.me/disruptingexploitation" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500">Join Telegram</a></li>
              <li><a href="/events" className="hover:text-pink-500">Events & Streams</a></li>
              <li><a href="/blog" className="hover:text-pink-500">Blog / Announcements</a></li>
            </ul>
          </div>

          {/* Column 4 - Discover */}
          <div>
            <h4 className="text-white font-semibold mb-3">Discover</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-pink-500">About</a></li>
              <li><a href="/impact" className="hover:text-pink-500">Impact</a></li>
              <li><a href="/media" className="hover:text-pink-500">Media / Press Kit</a></li>
              <li><a href="/contact" className="hover:text-pink-500">Contact</a></li>
            </ul>
          </div>

        </div>
      </footer>

      {/* Mini Fixed Footer (Socials + Copyright) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-black/90 backdrop-blur border-t border-gray-700 h-14 flex items-center justify-between px-4 md:px-10">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} 3ROTIX. Adults 18+ Only.</p>
        <div className="flex space-x-5 text-xl">
          <a href="https://twitter.com/smilebot3000" target="_blank" rel="noopener noreferrer">
            <FaTwitter className="hover:text-pink-500 transition" />
          </a>
          <a href="https://t.me/disruptingexploitation" target="_blank" rel="noopener noreferrer">
            <FaTelegramPlane className="hover:text-pink-500 transition" />
          </a>
          <a href="https://instagram.com/smilebotNFT" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="hover:text-pink-500 transition" />
          </a>
          <a href="https://github.com/VJsmilebot" target="_blank" rel="noopener noreferrer">
            <FaGithub className="hover:text-pink-500 transition" />
          </a>
        </div>
      </div>
    </>
  );
}
