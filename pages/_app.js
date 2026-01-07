// pages/_app.js
import "../styles/globals.css";
import Head from "next/head";
import Layout from "../components/Layout";
import AgeGate from "../components/AgeGate";
import AuthProvider from "../components/AuthProvider";
import EnsurePrismaUserOnMount from "../components/EnsurePrismaUserOnMount";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <EnsurePrismaUserOnMount />
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
}
