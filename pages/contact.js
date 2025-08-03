
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
            You can reach us directly via <a href="mailto:smilebot3000@gmail.com
" className="underline text-pink-500">smilebot3000@gmail.com
</a> — or just hit us up in the Telegram group.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
  );
}
