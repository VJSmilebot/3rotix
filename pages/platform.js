import Head from 'next/head';

export default function Platform() {
  return (
    <>
      <Head>
        <title>Platform Overview</title>
        <meta name="description" content="A short overview of the creator ecosystem we're building." />
      </Head>

      <div className="min-h-screen bg-gray-900">

        <main className="px-4">
          <div className="max-w-5xl mx-auto py-12">
            <div className="bg-gray-800 rounded-2xl shadow p-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Platform</h1>
              <p className="mt-4 text-gray-300 leading-relaxed">
                We’re building a creator‑first ecosystem that connects your profile, content, and monetization in one place.
                The platform brings together tools for publishing, audience growth, and collaboration—backed by a simple
                data model, sensible defaults, and secure authentication. Today this page is a placeholder; soon it will
                link the moving parts: profiles, media, analytics, and partner apps that extend the experience.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4">
                  <h2 className="text-lg font-semibold text-white">What’s here now</h2>
                  <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                    <li>Secure login with Supabase</li>
                    <li>Creator profile editing</li>
                    <li>Responsive, accessible UI</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 p-4">
                  <h2 className="text-lg font-semibold text-white">What’s coming</h2>
                  <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                    <li>Content publishing & scheduling</li>
                    <li>Audience & revenue analytics</li>
                    <li>Partner integrations & apps</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="/creator"
                  className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-5 py-2.5 text-white font-medium hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  Go to Creator
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
