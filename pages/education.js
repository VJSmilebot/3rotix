
import Layout from '../components/Layout';

export default function Education() {
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
            Education
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            At 3ROTIX, we believe knowledge is power. That’s why our Education page will offer guides, workshops, and creator-friendly resources to help you level up in everything from production and branding to legal safety and fan management.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Whether you're new to the scene or a seasoned pro, our curated educational content will give you the tools to grow, protect, and monetize your work — without the guesswork.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-8">
            Tutorials, strategy sessions, legal literacy, and ethical AI practices — all in one place.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
    </Layout>
  );
}
