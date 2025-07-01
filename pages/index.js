import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Background logo */}
      <div className="absolute inset-0 flex justify-center items-center z-0 pointer-events-none">
        <img
          src="/logo.png"
          alt="3ROTIX Logo Background"
          className="w-[15  00px] opacity-10"
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-48">
        <h1 className="text-5xl md:text-6xl font-bold text-pink-500 mb-8">
          Welcome to 3ROTIX
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-8">
          A new kind of creator platform — ethical, AI-powered, community-driven. <br />
          We're building the tools adult creators actually need.
        </p>
        <div className="flex flex-wrap gap-6 justify-center">
          <a
            href="https://t.me/disruptingexploitation"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg text-lg"
          >
            Join Telegram
          </a>
          <a
            href="mailto:smilebot3000@gmail.com"
            className="bg-white text-black px-6 py-3 rounded-lg text-lg"
          >
            Email Us
          </a>
        </div>
      </div>
    </Layout>
  );
}
