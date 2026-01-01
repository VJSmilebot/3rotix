import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import VideoUploader from '../components/VideoUploader';

export default function CreatorPage() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    handle: '',
    bio: '',
    website: '',
    twitter: '',
    instagram: '',
    image: '',
    isPublic: true,
  });
  const [myVideos, setMyVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      loadProfile(user.email);
    }
  }

  async function loadProfile(email) {
    try {
      const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
      
      if (!res.ok) {
        console.error('Profile fetch failed:', res.status);
        return;
      }
      
      const data = await res.json();
      setDbUser(data);
      setProfile({
        name: data.name || '',
        handle: data.handle || '',
        bio: data.bio || '',
        website: data.website || '',
        twitter: data.twitter || '',
        instagram: data.instagram || '',
        image: data.image || '',
        isPublic: data.isPublic !== false,
      });
      loadVideos(data.id);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  async function loadVideos(userId) {
    setLoadingVideos(true);
    try {
      console.log('Loading videos for user:', userId);
      const res = await fetch(`/api/videos?userId=${userId}`);
      
      if (!res.ok) {
        console.error('Videos fetch failed:', res.status);
        const errorData = await res.json();
        console.error('Error details:', errorData);
        return;
      }
      
      const data = await res.json();
      console.log('Loaded videos:', data);
      setMyVideos(data || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setMyVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${dbUser.id}/${fileName}`; // IMPORTANT: No "avatars/" prefix!

      console.log('Uploading to path:', filePath);

      // Delete old avatar if exists
      if (profile.image && profile.image.includes('supabase.co/storage')) {
        const oldPath = profile.image.split('/avatars/')[1];
        if (oldPath) {
          console.log('Deleting old avatar:', oldPath);
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Public URL:', data.publicUrl);

      setProfile({ ...profile, image: data.publicUrl });
      alert('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(`Failed to upload avatar: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  }

  const handleSave = async () => {
    if (!dbUser) {
      alert('User not loaded');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${dbUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name.trim() || null,
          bio: profile.bio.trim() || null,
          image: profile.image || null,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      alert('Profile saved!');
    } catch (error) {
      console.error('Save error:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  async function handleDeleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const res = await fetch(`/api/videos/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete video');
      }

      // Reload videos
      loadVideos(dbUser.id);
      alert('Video deleted!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.message);
    }
  }

  const importFromLivepeer = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/videos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUser.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to import videos');
      }

      alert('Import started! Check back later for your videos.');
    } catch (error) {
      console.error('Import error:', error);
      alert(error.message);
    } finally {
      setImporting(false);
    }
  };

  if (!user || !dbUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const container = { maxWidth: 1200, margin: '0 auto', padding: '40px 20px' };
  const section = { background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, marginBottom: 24 };
  const label = { display: 'block', fontSize: 14, marginBottom: 6, opacity: 0.9 };
  const input = { width: '100%', padding: 10, border: '1px solid #444', borderRadius: 8, background: '#111', color: '#fff', marginBottom: 16 };
  const button = { padding: '12px 24px', background: 'rgb(219, 39, 119)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 };

  return (
    <div style={container}>
      <h1 style={{ marginBottom: 32, fontSize: 32 }}>Creator Portal</h1>

      {/* Profile Settings */}
      <div style={section}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>Profile Settings</h2>

        {/* Avatar Upload */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', 
            background: '#222', border: '2px solid #444', display: 'grid', placeItems: 'center' 
          }}>
            {profile.image ? (
              <img src={profile.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
            )}
          </div>
          <div>
            <label style={{ ...button, display: 'inline-block', cursor: 'pointer' }}>
              {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={label}>Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              style={input}
              placeholder="Your display name"
            />
          </div>
          <div>
            <label style={label}>Handle</label>
            <input
              type="text"
              value={profile.handle}
              onChange={e => setProfile({...profile, handle: e.target.value})}
              style={input}
              placeholder="username"
            />
          </div>
        </div>

        <div>
          <label style={label}>Bio</label>
          <textarea
            value={profile.bio}
            onChange={e => setProfile({...profile, bio: e.target.value})}
            style={{...input, minHeight: 100, fontFamily: 'inherit'}}
            placeholder="Tell people about yourself..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={label}>Website</label>
            <input
              type="url"
              value={profile.website}
              onChange={e => setProfile({...profile, website: e.target.value})}
              style={input}
              placeholder="https://..."
            />
          </div>
          <div>
            <label style={label}>Twitter</label>
            <input
              type="text"
              value={profile.twitter}
              onChange={e => setProfile({...profile, twitter: e.target.value})}
              style={input}
              placeholder="@username"
            />
          </div>
          <div>
            <label style={label}>Instagram</label>
            <input
              type="text"
              value={profile.instagram}
              onChange={e => setProfile({...profile, instagram: e.target.value})}
              style={input}
              placeholder="@username"
            />
          </div>
        </div>

        {/* Privacy Toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!profile.isPublic}
              onChange={e => setProfile({...profile, isPublic: !e.target.checked})}
              style={{ width: 18, height: 18 }}
            />
            <span>Hide my profile from public directory</span>
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} style={button}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Video Upload */}
      <div style={section}>
        <VideoUploader onFinished={() => loadVideos(dbUser.id)} />
      </div>

      {/* My Videos */}
      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>My Videos ({myVideos.length})</h2>
          <button 
            onClick={importFromLivepeer}
            disabled={importing}
            style={{ 
              ...button, 
              background: importing ? '#666' : '#4338ca',
              padding: '8px 16px',
              fontSize: 14
            }}
          >
            {importing ? 'Importing...' : '↻ Import from Livepeer'}
          </button>
        </div>
        
        {loadingVideos ? (
          <p style={{ opacity: 0.7 }}>Loading videos...</p>
        ) : myVideos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No videos yet. Upload your first video above!</p>
        ) : (
          <CreatorVideoGrid videos={myVideos} onDelete={handleDeleteVideo} />
        )}
      </div>
    </div>
  );
}

function CreatorVideoGrid({ videos, onDelete }) {
  const [hoveredVideo, setHoveredVideo] = useState(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {videos.map(video => (
        <div 
          key={video.id} 
          style={{ border: '1px solid #333', borderRadius: 10, overflow: 'hidden', background: '#0a0a0a' }}
          onMouseEnter={() => setHoveredVideo(video.id)}
          onMouseLeave={() => setHoveredVideo(null)}
        >
          <div style={{ aspectRatio: '16/9', background: '#1a1a1a', position: 'relative' }}>
            {video.playbackId ? (
              <>
                {/* Static iframe thumbnail - always visible, no autoplay */}
                {hoveredVideo !== video.id && (
                  <iframe
                    src={`https://lvpr.tv?v=${video.playbackId}`}
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                    allow="picture-in-picture"
                  />
                )}
                
                {/* Playing iframe - only on hover */}
                {hoveredVideo === video.id && (
                  <iframe
                    src={`https://lvpr.tv?v=${video.playbackId}&autoplay=true&muted=true`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#666' }}>
                <span style={{ fontSize: 12, opacity: 0.5 }}>Processing...</span>
              </div>
            )}
          </div>
          <div style={{ padding: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, marginBottom: 4 }}>{video.title}</h3>
            <p style={{ fontSize: 13, opacity: 0.6, margin: 0, marginBottom: 8 }}>
              {video.visibility} • {video.views || 0} views
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {video.playbackId && (
                <a 
                  href={`/watch/uploads/${video.playbackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#db2777', textDecoration: 'none' }}
                >
                  Watch →
                </a>
              )}
              <button
                onClick={() => onDelete(video.id)}
                style={{ 
                  fontSize: 13, 
                  color: '#ef4444', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Delete
              </button>
            </div>
            <p style={{ fontSize: 11, opacity: 0.4, margin: '8px 0 0 0' }}>
              Created: {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
