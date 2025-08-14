// components/Footer.js
import { FaTwitter, FaTelegramPlane, FaInstagram, FaGithub } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    {
      icon: FaTelegramPlane,
      href: 'https://t.me/disruptingexploitation',
      label: 'Join our Telegram'
    },
    {
      icon: FaTwitter,
      href: 'https://twitter.com/3rotix',
      label: 'Follow us on Twitter'
    },
    {
      icon: FaInstagram,
      href: 'https://instagram.com/3rotix',
      label: 'Follow us on Instagram'
    },
    {
      icon: FaGithub,
      href: 'https://github.com/VJSmilebot/3rotix',
      label: 'View our code'
    },
  ];

  return (
    <footer className="bg-black text-white border-t border-gray-700 py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium">
              &copy; {currentYear} 3ROTIX. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Disrupting Exploitation. By Creators, For Creators.
            </p>
          </div>
          
          <div className="flex space-x-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors duration-200"
                aria-label={label}
                title={label}
              >
                <Icon className="text-xl" />
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <a href="/about" className="hover:text-white transition-colors">About</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/creator-portal" className="hover:text-white transition-colors">Creator Portal</a>
              <a href="/education" className="hover:text-white transition-colors">Education</a>
            </div>
            <div className="text-xs text-gray-500">
              Built with Next.js, Supabase & Livepeer
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
