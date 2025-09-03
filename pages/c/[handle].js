import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VideosGrid from '../../components/VideosGrid';
import { getSupabaseClient } from '../../utils/supabase/client';
import { createSupabaseServerClient } from '../../utils/supabase/server'; // <-- Use our helper

export async function getServerSideProps({ req, res, params }) {
  const { handle } = params;
  
  // Use the consistent server-side helper
  const supabase = createSupabaseServerClient(req, res);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, bio, avatar_url, handle, twitter, instagram, website')
    .eq('handle', handle)
    .single();

  if (error || !profile) {
    return { notFound: true };
  }
  
  return { 
    props: { 
      profile: profile
    } 
  };
}

// The rest of your component remains unchanged.
export default function PublicProfile({ profile }) {
  const [isOwner, setIsOwner] = useState(false);
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    async function checkOwnership() {
      const { data } = await supabase.auth.getUser();
      if (data?.user && data.user.id === profile.id) {
        setIsOwner(true);
      }
    }
    checkOwnership();
  }, [profile.id, supabase.auth]);

  const { handle, display_name, bio, avatar_url, twitter, instagram, website } = profile;

  const linkBtn = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: '1px solid #2a2a2a',
    borderRadius: 999,
    textDecoration: 'none',
    color: 'inherit',
    background: 'rgba(255,255,255,0.03)',
  };

  const editProfileBtn = {
    ...linkBtn,
    background: 'rgba(219, 39, 119, 0.1)',
    border: '1px solid rgba(219, 39, 119, 0.3)',
    color: 'rgb(236, 72, 153)'
  };

  return (
    <>
      <Head>
        <title>{display_name || handle} — 3rotix</title>
        <meta name="description" content={bio ? bio.slice(0, 150) : `${display_name || handle} on 3rotix`} />
        <meta property="og:title" content={`${display_name || handle} — 3rotix`} />
        <meta property="og:description" content={bio ? bio.slice(0, 150) : ''} />
        {avatar_url && <meta property="og:image" content={avatar_url} />}
      </Head>

      <div style={{ maxWidth: 980, margin: '24px auto', padding: 20 }}>
        <div style={{ position: 'relative' }}>
          {isOwner && (
            <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link 
                href="/creator"
                style={editProfileBtn}
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </Link>
              
              <Link 
                href="/studio"
                style={{
                  ...editProfileBtn,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'rgb(96, 165, 250)'
                }}
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Content Studio
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 160, height: 160, borderRadius: '50%', overflow: 'hidden',
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
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {website && (
                  <a 
                    href={website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={linkBtn}
                    className="flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z" stroke="currentColor"/>
                      <path d="M3 12h18M12 3c3 3 3 15 0 18c-3-3-15 0-18Z" stroke="currentColor"/>
                    </svg>
                    Website
                  </a>
                )}
                
                {twitter && (
                  <a
                    href={twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkBtn}
                    className="flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 5.8c-.7.3-1.5.6-2.3.7c.8-.5 1.4-1.2 1.7-2.2c-.8.5-1.7.9-2.6 1.1C18 4.6 17 4 15.8 4c-2.2 0-3.8 2-3.3 4.1A7.7 7.7 0 0 1 4.1 5c-.8 1.5-.4 3.4 1 4.3c-.6 0-1.2-.2-1.7-.5c0 1.7 1.2 3.3 3.1 3.7c-.5.1-1 .1-1.5 0c.4 1.4 1.8 2.5 3.4 2.6c-1.3 1-3 1.5-4.7 1.3c1.7 1.1 3.7 1.7 5.8 1.7c7 0 10.9-6 10.7-11.4c.7-.5 1.3-1.1 1.8-1.9Z"/>
                    </svg>
                    Twitter
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkBtn}
                    className="flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="6" width="16" height="14" rx="4" stroke="currentColor"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor"/>
                      <circle cx="18" cy="9" r="1" fill="currentColor"/>
                    </svg>
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {bio && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{bio}</p>}
        </div>

        <div style={{ marginTop: 32 }}>
          <VideosGrid userId={profile.id} />
        </div>
      </div>
    </>
  );
}