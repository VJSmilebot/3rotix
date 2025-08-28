// pages/creator.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseClient } from '../utils/supabase/client';
import VideoUploader from '../components/VideoUploader';

export async function getServerSideProps(ctx) {
  const supa = createPagesServerClient(ctx);
  const {
    data: { session },
  } = await supa.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/creator')}`,
        permanent: false,
      },
    };
  }

  // Load profile for the logged-in user
  const { data: profile } = await supa
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url, twitter, instagram, website')
    .eq('id', session.user.id)
    .single();

  // Load this user’s videos (any visibility)
  const { data: videos } = await supa
    .from('videos')
    .select('id, title, playback_id, visibility, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return {
    props: {
      userId: session.user.id,
      initialProfile: profile || null,
      initialVideos: videos || [],
    },
  };
}

export default function CreatorPage({ userId, initialProfile, initialVideos }) {
  const supabase = getSupabaseClient();

  // profile state
  const [handle, setHandle] = useState(initialProfile?.handle || '');
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '');
  const [twitter, setTwitter] = useState(initialProfile?.twitter || '');
  const [instagram, setInstagram] = useState(initialProfile?.instagram || '');
  const [website, setWebsite] = useState(initialProfile?.website || '');
  const [saving, setSaving] = useState(false);

  // video state
  const [myVideos, setMyVideos] = useState(initialVideos || []);

  // keep auth listener alive (optional)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {});
    return () => sub?.subscription?.unsubscribe();
  }, [supabase]);

  // ----- helpers -----
  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: 8,
    color: '#000',   // black text
    background: '#fff', // white bg
    marginBottom: 10,
  };

  const validateHandle = (h) => /^[a-z0-9_]{3,20}$/i.test(h || '');

  const normalizeUrl = (value) => {
    if (!value) return '';
    const v = value.trim();
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  };
  const normalizeTwitter = (value) => {
    if (!value) return '';
    let v = value.trim().replace(/^@/, '');
    if (/^https?:\/\//i.test(v)) return v;
    return `https://twitter.com/${v}`;
  };
  const normalizeInstagram = (value) => {
    if (!value) return '';
    let v = value.trim().replace(/^@/, '');
    if (/^https?:\/\//i.test(v)) return v;
    return `https://instagram.com/${v}`;
  };

  async function handleSave() {
    if (!userId) return;

    if (!handle || !validateHandle(handle)) {
      alert('Pick a handle: 3–20 letters/numbers/underscore.');
      return;
    }

    // ensure handle uniqueness (case-insensitive)
    const { data: exists, error: existsErr } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', userId)
      .ilike('handle', handle)
      .maybeSingle();

    if (existsErr) {
      alert(existsErr.message);
      return;
    }
    if (exists) {
      alert('That handle is already taken.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      handle,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl || null,
      twitter: twitter ? normalizeTwitter(twitter) : null,
      instagram: instagram ? normalizeInstagram(instagram) : null,
      website: website ? normalizeUrl(website) : null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) return alert(error.message);
    alert('Saved!');
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filePath = `${userId}/avatar.${ext}`;

    // Upload to Storage bucket "avatars" (must exist; set public)
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (upErr) return alert(upErr.message);

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl || '');
  }

  async function refreshMyVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, playback_id, visibility, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyVideos(data || []);
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 12, color: '#fff' }}>Creator Portal</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#111',
              border: '1px solid #333',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
            )}
          </div>
          <label style={{ display: 'block', marginTop: 10, color: '#ddd' }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* Profile fields */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <label style={{ color: '#ddd' }}>Handle (for your URL)</label>
          <input
            style={inputStyle}
            value={handle}
            onChange={(e) => setHandle(e.target.value.trim())}
            placeholder="e.g. smilebot"
          />
          <div style={{ margin: '6px 0 14px', fontSize: 12, opacity: 0.8, color: '#bbb' }}>
            Your public page will be <code>/c/{handle || 'your-handle'}</code>
          </div>

          <label style={{ color: '#ddd' }}>Display Name</label>
          <input
            style={inputStyle}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <label style={{ color: '#ddd' }}>Bio</label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fans who you are…"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#ddd' }}>Twitter (handle or URL)</label>
              <input
                style={inputStyle}
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@yourhandle or https://twitter.com/yourhandle"
              />
            </div>
            <div>
              <label style={{ color: '#ddd' }}>Instagram (handle or URL)</label>
              <input
                style={inputStyle}
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@yourhandle or https://instagram.com/yourhandle"
              />
            </div>
          </div>

          <label style={{ color: '#ddd' }}>Website</label>
          <input
            style={inputStyle}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your-site.com"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 14px',
              border: '1px solid #444',
              borderRadius: 8,
              background: saving ? '#333' : '#ff2fb9',
              color: '#fff',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Videos */}
      <hr style={{ margin: '24px 0', borderColor: '#333' }} />
      <h2 style={{ marginBottom: 12, color: '#fff' }}>Your Videos</h2>

      <VideoUploader onFinished={refreshMyVideos} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        {(myVideos || []).map((v) => (
          <div
            key={v.id}
            style={{ border: '1px solid #2a2a2a', borderRadius: 12, padding: 12 }}
          >
            <div style={{ fontWeight: 600, color: '#fff' }}>
              {v.title || 'Untitled'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8, color: '#bbb' }}>
              {v.visibility?.toUpperCase() || 'PUBLIC'}
            </div>
            <Link
              href={`/watch/${v.playback_id}`}
              style={{ textDecoration: 'underline', color: '#ff2fb9' }}
            >
              Watch →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
  