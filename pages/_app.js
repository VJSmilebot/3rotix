// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import AppShell from '../components/AppShell';
import Layout from '../components/Layout';
import AgeGate from '../components/AgeGate';
import AuthProvider from '../components/AuthProvider';
import { getSupabaseClient } from '../utils/supabase/client';
import EnsurePrismaUserOnMount from '../components/EnsurePrismaUserOnMount';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// NOTE: Livepeer removed from _app to unblock production builds.
// We will initialize Livepeer only on streaming pages.

function LayoutSelector({ children, isLoggedIn, pathname }) {
  const useOldLayout =
    !isLoggedIn ||
    ['/login', '/reset', '/about', '/contact', '/faq', '/pricing', '/features', '/support'].includes(pathname);

  if (useOldLayout) return <Layout>{children}</Layout>;
  return <AppShell>{children}</AppShell>;
}

export default function App({ Component, pageProps }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkAuth();
  }, []);

  return (
    <AuthProvider>
      <EnsurePrismaUserOnMount />
      <AgeGate>
        <Head>
          <title>3ROTIX</title>
          <meta name="description" content="3ROTIX Creator Platform" />
          <link rel="icon" href="/favicon.png" />
        </Head>

        {/* Use LayoutSelector (you weren’t using it before) */}
        <LayoutSelector isLoggedIn={isLoggedIn} pathname={router.pathname}>
          <Component {...pageProps} />
        </LayoutSelector>
      </AgeGate>
    </AuthProvider>
  );
}
