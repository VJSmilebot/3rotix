
import Layout from '../components/Layout';

export default function CreatorPortal() {
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
            Creator Portal
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            The Creator Portal is the heart of your 3ROTIX experience. Here, you’ll find powerful tools to manage your content, connect with collaborators, and track your growth in real time.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Whether you're a solo artist or part of a dynamic duo, we’ve built everything with flexibility, transparency, and creative control in mind. Upload your content, manage subscriptions, explore partnerships, and unlock your earning potential — all in one place.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-8">
            This is where your content comes to life. Seamless. Secure. Built for you.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
    </Layout>
  );
}
