export default function Contact() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Logo */}
      <div className="absolute inset-0 flex justify-center items-center opacity-10 z-0 pointer-events-none">
        <img
          src="/logo.png"
          alt="3ROTIX Logo Background"
          className="w-[900px] h-auto"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-32">
        <h1 className="text-4xl font-bold text-pink-500 mb-4">Contact</h1>
        <p className="max-w-3xl text-lg text-gray-300 mb-6">
          Got questions, ideas, or want to collaborate? We'd love to hear from you. The 3ROTIX project is built on connection — between creators, supporters, and thinkers across every spectrum.
        </p>
        <p className="max-w-3xl text-lg text-gray-300 mb-8">
          You can reach us directly via the following ways.
        </p>
        
        {/* Contact Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          <a href="mailto:collabs@3rotix.com" className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg hover:opacity-90 transition-opacity">
            <div className="font-medium text-lg">Partnerships & Collabs</div>
            <div className="text-white/80">collabs@3rotix.com</div>
          </a>
          
          <a href="mailto:creators@3rotix.com" className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg hover:opacity-90 transition-opacity">
            <div className="font-medium text-lg">Creator Support</div>
            <div className="text-white/80">creators@3rotix.com</div>
          </a>
          
          <a href="mailto:legal@3rotix.com" className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg hover:opacity-90 transition-opacity">
            <div className="font-medium text-lg">Legal & Compliance</div>
            <div className="text-white/80">legal@3rotix.com</div>
          </a>
          
          <a href="mailto:support@3rotix.com" className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg hover:opacity-90 transition-opacity">
            <div className="font-medium text-lg">Technical Support</div>
            <div className="text-white/80">support@3rotix.com</div>
          </a>
          
          <a href="mailto:Smiley@3rotix.com" className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg hover:opacity-90 transition-opacity">
            <div className="font-medium text-lg">Contact Founder</div>
            <div className="text-white/80">Smiley@3rotix.com</div>
          </a>
        </div>
        
        {/* Telegram Group Section */}
        <div className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-300 mb-6">
            Connect with us and other enthusiasts in our Telegram group. It's the best place to stay updated, ask questions, and be part of the 3ROTIX journey.
          </p>
          <a href="https://t.me/disruptingexploitation" className="inline-block px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-500 rounded-lg text-center font-semibold text-white hover:opacity-90 transition-opacity">
            Join Telegram Group
          </a>
        </div>
      </div>
    </div>
  );
}
