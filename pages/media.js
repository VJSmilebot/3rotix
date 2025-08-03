
export default function Media() {
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
            Media
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            From behind-the-scenes peeks to featured artist showcases, this is where the 3ROTIX visual experience comes alive. Expect exclusive video reels, creator interviews, VJ sets, trailers, and collaborative campaigns that amplify creative vision.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-6">
            Our media space highlights the raw, real, and radiant energy that powers the 3ROTIX universe — featuring voices and visuals from across the spectrum of adult artistry.
          </p>
          <p className="max-w-3xl text-lg text-gray-300 mb-8">
            Videos, teasers, and talent drops coming soon.
          </p>
          <p className="text-5xl font-extrabold text-white opacity-80">COMING SOON</p>
        </div>
      </div>
  );
}
