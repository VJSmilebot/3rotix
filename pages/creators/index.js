// pages/creators/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export async function getServerSideProps() {
  const url =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}` +
    `/rest/v1/profiles?select=id,handle,display_name,bio,avatar_url` +
    `&not.is.null=handle&order=handle.asc`;

  /** Helper to redact sensitive env values in logs */
  const redact = (s) => (typeof s === 'string' ? s.replace(/.{6}$/,'******') : s);

  let rows = [];
  let errorInfo = null;

  try {
    console.log('[CREATORS] Fetching profiles from:', url);
    console.log('[CREATORS] Using anon key (redacted tail):', redact(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        // Optional: ask PostgREST to include a count header
        Prefer: 'count=exact',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      errorInfo = {
        status: res.status,
        statusText: res.statusText,
        body: text?.slice(0, 500),
      };
      console.error('[CREATORS] Supabase REST error:', errorInfo);
    } else {
      const countHeader = res.headers.get('content-range'); // e.g. 0-19/123
      console.log('[CREATORS] content-range header:', countHeader);

      const json = await res.json();
      if (Array.isArray(json)) {
        rows = json;
        console.log(`[CREATORS] Loaded ${rows.length} profiles`);
      } else {
        errorInfo = { message: 'Response was not an array', sample: JSON.stringify(json).slice(0, 500) };
        console.error('[CREATORS] Unexpected JSON:', errorInfo);
      }
    }
  } catch (err) {
    errorInfo = { message: 'Fetch threw', detail: String(err) };
    console.error('[CREATORS] Fetch failed:', err);
  }

  // Always return an array so the page doesn't crash
  return { props: { initialProfiles: Array.isArray(rows) ? rows : [], errorInfo } };
}

export default function CreatorsDirectory({ initialProfiles, errorInfo }) {
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    if (!Array.isArray(initialProfiles)) return [];
    const term = q.trim().toLowerCase();
    if (!term) return initialProfiles;
    return initialProfiles.filter((p) =>
      (p.display_name || '').toLowerCase().includes(term) ||
      (p.handle || '').toLowerCase().includes(term) ||
      (p.bio || '').toLowerCase().includes(term)
    );
  }, [q, initialProfiles]);

  const input = {
    width: '100%', padding: '10px', border: '1px solid #ccc',
    borderRadius: 6, color: '#000', background: '#fff', marginBottom: 16,
  };

  const card = {
    border: '1px solid #333', borderRadius: 12, padding: 12, textDecoration: 'none', color: 'inherit',
    background: 'rgba(255,255,255,0.02)',
  };

  const avatarWrap = {
    width: '100%', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden',
    background: '#111', border: '1px solid #222', marginBottom: 10,
    display: 'grid', placeItems: 'center',
  };

  return (
    <>
      <Head>
        <title>Creators — 3rotix</title>
        <meta name="description" content="Browse creators on 3rotix." />
      </Head>

      <div style={{ maxWidth: 1040, margin: '24px auto', padding: 20 }}>
        <h1 style={{ marginBottom: 12 }}>Creators</h1>

        {/* If there was a server-side fetch issue, show a gentle note in dev */}
        {errorInfo && (
          <pre style={{
            background: 'rgba(255,0,0,0.06)',
            border: '1px solid rgba(255,0,0,0.2)',
            padding: 12,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
            marginBottom: 16,
            display: process.env.NODE_ENV === 'development' ? 'block' : 'none',
          }}>
            <b>Debug (server):</b> {JSON.stringify(errorInfo, null, 2)}
          </pre>
        )}

        <input
          style={input}
          placeholder="Search creators by name, handle, or bio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {Array.isArray(list) && list.length === 0 && (
          <p style={{ opacity: 0.8 }}>No creators found. Try a different search.</p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
          gap: 16
        }}>
          {(Array.isArray(list) ? list : []).map((p) => (
            <Link key={p.id} href={`/c/${p.handle}`} style={card}>
              <div style={avatarWrap}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{p.display_name || p.handle}</div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>@{p.handle}</div>
                {p.bio && (
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
                    {p.bio.length > 140 ? `${p.bio.slice(0, 140)}…` : p.bio}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
