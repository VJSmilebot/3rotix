// components/Footer.js
import { FaTwitter, FaTelegramPlane, FaInstagram, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-700 py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <p className="text-sm">&copy; {new Date().getFullYear()} 3ROTIX. All rights reserved.</p>
        <div className="flex space-x-5 text-2xl">
          <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer">
            <FaTwitter className="hover:text-pink-500 transition" />
          </a>
          <a href="https://t.me/yourgroup" target="_blank" rel="noopener noreferrer">
            <FaTelegramPlane className="hover:text-pink-500 transition" />
          </a>
          <a href="https://instagram.com/yourhandle" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="hover:text-pink-500 transition" />
          </a>
          <a href="https://github.com/yourrepo" target="_blank" rel="noopener noreferrer">
            <FaGithub className="hover:text-pink-500 transition" />
          </a>
        </div>
      </div>
    </footer>
  );
}
