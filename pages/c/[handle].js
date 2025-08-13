// pages/c/[handle].js
import Head from 'next/head';

export async function getServerSideProps({ params }) {
  const handle = params.handle;

  // Fetch via Supabase REST with your anon key (public read policy required)
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?handle=eq.${encodeURIComponent(
    handle
  )}&select=id,display_name,bio,avatar_url,handle`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });

  const rows = await res.json();
  const profile = Array.isArray(rows) && rows[0] ? rows[0] : null;

  if (!profile) return { notFound: true };
  return { props: { profile } };
}

export default function PublicProfile({ profile }) {
  const { handle, display_name, bio, avatar_url } = profile;

  return (
    <>
      <Head>
        <title>{display_name || handle} — Profile</title>
      </Head>

      <div style={{ maxWidth: 900, margin: '24px auto', padding: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', overflow: 'hidden',
            background: '#111', border: '1px solid #333', display: 'grid', placeItems: 'center'
          }}>
            {avatar_url ? (
              <img src={avatar_url} alt={`${handle} avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
            )}
          </div>

          <div>
            <h1 style={{ margin: 0 }}>{display_name || handle}</h1>
            <div style={{ opacity: 0.8 }}>@{handle}</div>
          </div>
        </div>

        {bio && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{bio}</p>}
      </div>
    </>
  );
}
