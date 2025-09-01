// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import Layout from '../components/Layout';
import AgeGate from '../components/AgeGate';
import AuthProvider from '../components/AuthProvider';
import { getSupabaseClient } from '../utils/supabase/client';

// Try to import Livepeer bits, but handle versions where studioProvider isn't exported
import * as LR from '@livepeer/react';

const apiKey = process.env.NEXT_PUBLIC_LIVEPEER_STUDIO_API_KEY || '';
const hasStudioProvider = typeof LR.studioProvider === 'function';
const client = hasStudioProvider
  ? LR.createReactClient({ provider: LR.studioProvider({ apiKey }) })
  : null;

export default function App({ Component, pageProps }) {
  const AppTree = (
    <AuthProvider>
      <AgeGate>
        <Head>
          <title>3ROTIX</title>
          <meta name="description" content="3ROTIX Creator Platform" />
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AgeGate>
    </AuthProvider>
  );

  // If client exists, wrap with LivepeerConfig; otherwise just render normally
  return client && LR.LivepeerConfig ? (
    <LR.LivepeerConfig client={client}>{AppTree}</LR.LivepeerConfig>
  ) : (
    AppTree
  );
}
