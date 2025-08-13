// pages/creator.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../utils/supabase/client';

export default function CreatorPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // require login
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      // fetch profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, handle')
        .eq('id', data.user.id)
        .single();

      if (!error && profile) {
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatar_url || '');
        setHandle(profile.handle || '');
      }
    });
  }, []);

  const validateHandle = (h) => /^[a-z0-9_]{3,20}$/i.test(h || '');

  const handleSave = async () => {
    if (!user) return;

    // basic handle validation
    if (!handle || !validateHandle(handle)) {
      alert('Pick a handle: 3–20 letters/numbers/underscore');
      return;
    }

    // is that handle taken by someone else?
    const { data: exists } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', user.id)
      .ilike('handle', handle)
      .maybeSingle();

    if (exists) {
      alert('That handle is already taken.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        handle,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) return alert(error.message);
    alert('Saved!');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // upload to Storage bucket "avatars" at <user.id>/avatar.ext
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    // if bucket is public, use public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
  };

  if (!user) return <p style={{ padding: 20 }}>Loading…</p>;

  const input = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    color: '#000',
    background: '#fff',
    marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Creator Profile</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', overflow: 'hidden',
            background: '#111', border: '1px solid #333', display: 'grid', placeItems: 'center'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
            )}
          </div>
          <label style={{ display: 'block', marginTop: 10 }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <label>Handle (for your URL)</label>
          <input
            style={input}
            value={handle}
            onChange={(e) => setHandle(e.target.value.trim())}
            placeholder="e.g. smilebot"
          />
          <div style={{ margin: '6px 0 14px', fontSize: 12, opacity: 0.8 }}>
            Your public page will be at <code>/c/{handle || 'your-handle'}</code>
          </div>

          <label>Display Name</label>
          <input
            style={input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <label>Bio</label>
          <textarea
            style={{ ...input, minHeight: 120, resize: 'vertical' }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fans who you are…"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 14px', border: '1px solid #444', borderRadius: 6 }}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
