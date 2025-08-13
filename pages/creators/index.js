// pages/creators/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

export async function getServerSideProps({ query }) {
  // Correct PostgREST "not null" filter
  const url =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}` +
    `/rest/v1/profiles?select=id,handle,display_name,bio,avatar_url,updated_at` +
    `&handle=not.is.null&order=handle.asc`;

  let rows = [];
  let errorInfo = null;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        Prefer: 'count=exact',
      },
    });

    if (!res.ok) {
      errorInfo = {
        status: res.status,
        statusText: res.statusText,
        body: (await res.text())?.slice(0, 500),
      };
      console.error('[CREATORS] REST error:', errorInfo);
    } else {
      const json = await res.json();
      rows = Array.isArray(json) ? json : [];
    }
  } catch (err) {
    errorInfo = { message: 'Fetch failed', detail: String(err) };
    console.error('[CREATORS] Fetch failed:', err);
  }

  // Pass through any initial query params (optional)
  return {
    props: {
      initialProfiles: rows,
      errorInfo: errorInfo || null,
      initialQ: query.q || '',
      initialSort: query.sort || 'handle',
      initialDir: query.dir || 'asc',
      initialHasPhoto: query.photo === '1' ? true : false,
    },
  };
}

export default function CreatorsDirectory({
  initialProfiles,
  errorInfo,
  initialQ,
  initialSort,
  initialDir,
  initialHasPhoto,
}) {
  // Controls
  const [q, setQ] = useState(initialQ);
  const [sortBy, setSortBy] = useState(initialSort); // 'handle' | 'display_name'
  const [dir, setDir] = useState(initialDir); // 'asc' | 'desc'
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto);

  // Apply filters + sort in memory (SSR gave us the data)
  const filtered = useMemo(() => {
    const src = Array.isArray(initialProfiles) ? initialProfiles : [];
    const term = q.trim().toLowerCase();

    let items = src.filter((p) => {
      if (hasPhoto && !p.avatar_url) return false;
      if (!term) return true;
      return (
        (p.display_name || '').toLowerCase().includes(term) ||
        (p.handle || '').toLowerCase().includes(term) ||
        (p.bio || '').toLowerCase().includes(term)
      );
    });

    items.sort((a, b) => {
      const A = ((sortBy === 'display_name' ? a.display_name : a.handle) || '').toLowerCase();
      const B = ((sortBy === 'display_name' ? b.display_name : b.handle) || '').toLowerCase();
      if (A < B) return dir === 'asc' ? -1 : 1;
      if (A > B) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [initialProfiles, q, sortBy, dir, hasPhoto]);

  // Keep URL in sync with controls (optional, nice for sharing links)
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sortBy !== 'handle') params.set('sort', sortBy);
    if (dir !== 'asc') params.set('dir', dir);
    if (hasPhoto) params.set('photo', '1');
    const next = params.toString() ? `/creators?${params.toString()}` : '/creators';
    window.history.replaceState(null, '', next);
  }, [q, sortBy, dir, hasPhoto]);

  const input = {
    width: '100%', padding: '10px', border: '1px solid #ccc',
    borderRadius: 8, color: '#000', background: '#fff',
  };

  const select = {
    ...input,
    width: '100%',
    appearance: 'none',
  };

  const card = {
    border: '1px solid #2a2a2a',
    borderRadius: 14,
    padding: 12,
    textDecoration: 'none',
    color: 'inherit',
    background: 'rgba(255,255,255,0.02)',
    transition: 'transform .12s ease, border-color .12s ease, background .12s ease',
  };

  const cardHover = {
    transform: 'translateY(-2px)',
    borderColor: '#444',
    background: 'rgba(255,255,255,0.04)',
  };

  const avatarWrap = {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#111',
    border: '1px solid #222',
    marginBottom: 10,
    display: 'grid',
    placeItems: 'center',
  };

  return (
    <>
      <Head>
        <title>Creators — 3rotix</title>
        <meta name="description" content="Browse creators on 3rotix." />
      </Head>

      <div style={{ maxWidth: 1100, margin: '24px auto', padding: 20 }}>
        <h1 style={{ marginBottom: 12 }}>Creators</h1>

        {/* Debug box (only in dev) */}
        {errorInfo && process.env.NODE_ENV === 'development' && (
          <pre style={{
            background: 'rgba(255,0,0,0.06)',
            border: '1px solid rgba(255,0,0,0.2)',
            padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', marginBottom: 16,
          }}>
            <b>Debug (server):</b> {JSON.stringify(errorInfo, null, 2)}
          </pre>
        )}

        {/* Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .6fr .6fr .5fr',
          gap: 12,
          marginBottom: 16,
        }}>
          <input
            style={input}
            placeholder="Search creators by name, handle, or bio…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            style={select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="handle">Sort: Handle</option>
            <option value="display_name">Sort: Display name</option>
          </select>

          <select
            style={select}
            value={dir}
            onChange={(e) => setDir(e.target.value)}
          >
            <option value="asc">Direction: A → Z</option>
            <option value="desc">Direction: Z → A</option>
          </select>

          <label style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 8,
            background: '#fff',
            color: '#000',
          }}>
            <input
              type="checkbox"
              checked={hasPhoto}
              onChange={(e) => setHasPhoto(e.target.checked)}
            />
            Has photo
          </label>
        </div>

        {/* Empty state */}
        {(!filtered || filtered.length === 0) && (
          <p style={{ opacity: 0.8 }}>No creators found. Try adjusting filters or search.</p>
        )}

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
          gap: 16,
        }}>
          {(filtered || []).map((p) => (
            <Link
              key={p.id}
              href={`/c/${p.handle}`}
              style={card}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={avatarWrap}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#777', fontSize: 12 }}>No photo</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  {p.display_name || p.handle}
                </div>
                <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 6 }}>@{p.handle}</div>
                {p.bio && (
                  <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
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
