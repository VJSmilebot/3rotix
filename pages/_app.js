// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { NotificationProvider } from '../components/Notification';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Head>
          <title>3ROTIX - Creator Platform</title>
          <meta name="description" content="3ROTIX: Disrupting Exploitation. By Creators, For Creators. Build your brand, take a stand." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          
          {/* Open Graph / Social Media */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="3ROTIX - Creator Platform" />
          <meta property="og:description" content="Disrupting Exploitation. By Creators, For Creators." />
          <meta property="og:image" content="/logo.png" />
          <meta property="og:url" content="https://3rotix.com" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="3ROTIX - Creator Platform" />
          <meta name="twitter:description" content="Disrupting Exploitation. By Creators, For Creators." />
          <meta name="twitter:image" content="/logo.png" />
          
          {/* Additional SEO */}
          <meta name="keywords" content="creator platform, content creation, video platform, creators, 3rotix" />
          <meta name="author" content="3ROTIX" />
          <link rel="canonical" href="https://3rotix.com" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
