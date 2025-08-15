// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>3ROTIX</title>
        <meta name="description" content="3ROTIX Creator Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        {/* Keep content from sitting under the fixed footer */}
        <main className="pb-[calc(4rem+env(safe-area-inset-bottom))]">
          <Component {...pageProps} />
        </main>
      </Layout>

      {/* Sticky footer overlay (global) */}
      <footer className="fixed bottom-0 left-0 w-full bg-black text-white p-4 text-center z-50">
        My sticky footer overlay
      </footer>
    </>
  );
}
