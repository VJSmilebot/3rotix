import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function MarketplaceLanding() {
  const [featuredBundles, setFeaturedBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  async function loadFeaturedContent() {
    setLoading(true);
    try {
      const res = await fetch('/api/bundles/all');
      if (res.ok) {
        const bundles = await res.json();
        setFeaturedBundles(bundles.slice(0, 6)); // Get first 6
      }
    } catch (err) {
      console.error('Error loading featured content:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Marketplace - 3rotix</title>
        <meta name="description" content="Shop exclusive content bundles, event tickets, and custom requests from creators" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-black" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-pink-600 rounded-full blur-[128px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600 rounded-full blur-[128px]" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Marketplace
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Discover exclusive content, unlock premium experiences, and connect directly with creators
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="#bundles"
                  className="px-8 py-4 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-pink-500/30"
                >
                  Browse Bundles
                </Link>
                <Link
                  href="/your-bag"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-lg transition-all border border-gray-700"
                >
                  💰 Your Lipz
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-gray-800 bg-black/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-pink-400 mb-2">1,000+</div>
                <div className="text-gray-400">Content Bundles</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">500+</div>
                <div className="text-gray-400">Active Creators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">10k+</div>
                <div className="text-gray-400">Happy Buyers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Shop by Category</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bundles */}
            <Link href="/bundles" className="group">
              <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-600/30 hover:border-pink-600/60 transition-all">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-2xl font-bold mb-2">Content Bundles</h3>
                  <p className="text-gray-300 mb-4">Exclusive photosets, video packs, and more</p>
                  <div className="px-4 py-2 bg-pink-600 rounded-full text-sm font-bold group-hover:bg-pink-700 transition-all">
                    Browse Bundles →
                  </div>
                </div>
              </div>
            </Link>

            {/* Event Tickets */}
            <div className="group relative">
              <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 hover:border-purple-600/60 transition-all">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="text-6xl mb-4">🎫</div>
                  <h3 className="text-2xl font-bold mb-2">Event Tickets</h3>
                  <p className="text-gray-300 mb-4">Access exclusive streams and events</p>
                  <div className="px-4 py-2 bg-purple-600/50 rounded-full text-sm font-bold">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Requests */}
            <div className="group relative">
              <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 hover:border-blue-600/60 transition-all">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold mb-2">Custom Requests</h3>
                  <p className="text-gray-300 mb-4">Request personalized content from creators</p>
                  <div className="px-4 py-2 bg-blue-600/50 rounded-full text-sm font-bold">
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Bundles */}
        <section id="bundles" className="bg-gradient-to-b from-black to-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">Featured Bundles</h2>
              <Link
                href="/bundles"
                className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-2"
              >
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading bundles...</div>
            ) : featuredBundles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No bundles available yet. Check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step
              number="1"
              icon="💰"
              title="Get Lipz"
              description="Load your wallet with Lipz, our platform currency"
            />
            <Step
              number="2"
              icon="🔍"
              title="Browse Content"
              description="Explore bundles, events, and custom request options"
            />
            <Step
              number="3"
              icon="🛒"
              title="Make Purchase"
              description="Unlock content with your Lipz balance"
            />
            <Step
              number="4"
              icon="🎉"
              title="Enjoy"
              description="Access your purchased content instantly and forever"
            />
          </div>
        </section>

        {/* Creator CTA */}
        <section className="border-y border-gray-800 bg-gradient-to-r from-pink-900/10 to-purple-900/10">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Are you a creator?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Start selling your content, hosting paid events, and accepting custom requests
            </p>
            <Link
              href="/studio/bundles"
              className="inline-block px-8 py-4 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-pink-500/30"
            >
              Create Your First Bundle
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <FAQItem
              question="What are Lipz?"
              answer="Lipz are the platform currency used to purchase bundles, event tickets, and custom content. You can add Lipz to your wallet from the 'Your Bag' page."
            />
            <FAQItem
              question="Can I get a refund?"
              answer="All sales are final. Once you purchase a bundle or ticket, you'll have permanent access to that content."
            />
            <FAQItem
              question="How do creators get paid?"
              answer="Creators earn 90% of each sale. They can withdraw their earnings to their bank account via the creator dashboard."
            />
            <FAQItem
              question="Is my payment secure?"
              answer="Yes! All transactions are processed securely through our payment partners. Your payment information is never stored on our servers."
            />
          </div>
        </section>
      </div>
    </>
  );
}

function BundleCard({ bundle }) {
  return (
    <Link href={`/bundles/${bundle.id}`} className="group">
      <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-pink-600/50 transition-all hover:shadow-xl hover:shadow-pink-600/10">
        <div className="relative h-48 bg-gradient-to-br from-pink-900/20 to-purple-900/20">
          {bundle.coverImage ? (
            <img
              src={bundle.coverImage}
              alt={bundle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
              📦
            </div>
          )}
          <div className="absolute top-3 right-3 px-3 py-1 bg-pink-600 rounded-full text-xs font-bold shadow-lg">
            {bundle.price} Lipz
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 group-hover:text-pink-400 transition-colors line-clamp-1">
            {bundle.title}
          </h3>
          {bundle.description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {bundle.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              {bundle.items?.length || 0} items
            </div>
            <div className="text-gray-500">
              {bundle._count?.purchases || 0} sales
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Step({ number, icon, title, description }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center bg-[#0f0f0f] hover:bg-gray-900 transition-colors text-left"
      >
        <span className="font-bold">{question}</span>
        <span className="text-2xl text-pink-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-black border-t border-gray-800">
          <p className="text-gray-300">{answer}</p>
        </div>
      )}
    </div>
  );
}