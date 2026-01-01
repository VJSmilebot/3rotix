// pages/creator-portal.js
export default function CreatorPortal() {
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
        <h1 className="text-4xl font-bold text-pink-500 mb-4">
          Creator Portal
        </h1>

        {/* Intro paragraph */}
        <p className="max-w-3xl text-lg text-gray-300 mb-6">
          The Creator Portal is the heart of your 3ROTIX experience. Here, you’ll find powerful tools to manage your content, connect with collaborators, and track your growth in real time.
        </p>

        {/* Motivational / ethics / gamification paragraph */}
        <p className="max-w-3xl text-lg text-gray-300 mb-6">
          3ROTIX is built <span className="font-semibold">by creators, for creators</span>. 
          This isn’t just a platform — it’s a movement to 
          <span className="italic"> disrupt exploitation </span> and flip the script on how content is valued. 
          With ethics and transparency at the core, plus gamification and reward systems baked in, 
          early creators will unlock exclusive perks and recognition. 
          You’re not just earning — you’re helping rewrite the rules of the industry.
        </p>

        {/* Other paragraphs */}
        <p className="max-w-3xl text-lg text-gray-300 mb-6">
          Whether you're a solo artist or part of a dynamic duo, we’ve built everything with flexibility, transparency, and creative control in mind. Upload your content, manage subscriptions, explore partnerships, and unlock your earning potential — all in one place.
        </p>
        <p className="max-w-3xl text-lg text-gray-300 mb-10">
          This is where your content comes to life. Seamless. Secure. Built for you.
        </p>

        {/* CTA row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/creator"
            className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold"
          >
            Sign Up as Creator
          </a>

          <a
            href="/tools"
            className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
          >
            Creator Tools
          </a>

          <a
            href="/legal"
            className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10"
          >
            Legal Hub
          </a>

          <a
            href="https://t.me/disruptingexploitation"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200"
          >
            Community
          </a>
        </div>
      </div>
    </div>
  );
}
