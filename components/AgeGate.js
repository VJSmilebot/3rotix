// components/AgeGate.js
'use client';
import { useEffect, useState } from 'react';

export default function AgeGate({ children }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try { setOk(localStorage.getItem('age_ok') === '1'); } catch {}
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen grid place-items-center bg-[#0a0a0b] text-white/70">Loading…</div>;
  }
  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0a0b] text-white px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">18+ Only</h2>
          <p className="text-white/70 mb-4">This platform is for adults. Please confirm to continue.</p>
          <button className="rounded-xl px-4 py-2 bg-pink-600" onClick={() => { localStorage.setItem('age_ok','1'); setOk(true); }}>
            I’m 18+
          </button>
        </div>
      </div>
    );
  }
  return children;
}
