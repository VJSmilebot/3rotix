
export default function About() {
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
            About 3ROTIX
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            3ROTIX is an ethical, AI-powered creator platform designed to support and elevate adult content creators through innovation, transparency, and community. We’re creating a safer, smarter space for adult creators to thrive — with tools that simplify production, amplify income, and protect creative freedom.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Our mission is to build the infrastructure that’s been missing in the adult industry: intuitive tech, fair monetization, and educational resources. From blockchain-backed ownership to customizable storefronts, we’re blending cutting-edge technology with a deep respect for the people behind the content.
          </p>
          <p className="max-w-3xl text-lg text-gray-300">
            We believe in sex positivity, creator autonomy, and systemic change. 3ROTIX is where adult creators finally get the platform they deserve.
          </p>
        </div>
      </div>
  );
}
