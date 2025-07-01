// pages/_app.js
import "../styles/globals.css";
import AgeGate from "../components/AgeGate";

export default function App({ Component, pageProps }) {
  return (
    <>
      <AgeGate />
      <Component {...pageProps} />
    </>
  );
}
