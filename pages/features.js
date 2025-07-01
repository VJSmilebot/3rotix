
import Layout from '../components/Layout';

export default function Features() {
  return (
    <Layout>
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
            Features
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            3ROTIX is built with creators in mind, offering tools that simplify, amplify, and empower. From frictionless uploads and custom storefronts to built-in scheduling and AI-enhanced editing — we’re raising the standard for adult platforms.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Our roadmap includes secure messaging, NFT integration, seamless paywall control, and intelligent fan engagement tools. You’ll also get access to live analytics, collab systems, and permission-based sharing tools.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-8">
            Every feature is built to support your creativity, autonomy, and success.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
    </Layout>
  );
}
