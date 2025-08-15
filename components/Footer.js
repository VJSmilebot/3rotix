// components/Footer.js
import { FaTwitter, FaTelegramPlane, FaInstagram, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    // Make the footer an overlay fixed to bottom (no top margin)
    <footer className="fixed inset-x-0 bottom-0 z-50">
      {/* keep your original look; just wrapped to control height/blur/border */}
      <div className="bg-black/90 backdrop-blur border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p className="text-sm">&copy; {new Date().getFullYear()} 3ROTIX. All rights reserved.</p>
          <div className="flex space-x-5 text-2xl">
            <a href="https://twitter.com/smilebot3000 " target="_blank" rel="noopener noreferrer">
              <FaTwitter className="hover:text-pink-500 transition" />
            </a>
            <a href="https://t.me/disruptingexplotion " target="_blank" rel="noopener noreferrer">
              <FaTelegramPlane className="hover:text-pink-500 transition" />
            </a>
            <a href="https://instagram.com/smilebotNFT  " target="_blank" rel="noopener noreferrer">
              <FaInstagram className="hover:text-pink-500 transition" />
            </a>
            <a href="https://github.com/VJsmilebot" target="_blank" rel="noopener noreferrer">
              <FaGithub className="hover:text-pink-500 transition" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
