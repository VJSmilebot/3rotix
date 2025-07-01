
import Layout from '../components/Layout';

export default function Impact() {
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
            Impact
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            3ROTIX is more than just a platform — it's a movement. We’re reshaping the future of adult content by prioritizing ethical production, creator safety, and inclusive representation across every layer of our ecosystem.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Our mission is rooted in systemic change: destigmatizing sex work, creating opportunities for underserved voices, and fostering open dialogue through technology, art, and education.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-8">
            With every tool, campaign, and collaboration, 3ROTIX aims to leave a legacy of empowerment, transparency, and unapologetic creativity.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
    </Layout>
  );
}
