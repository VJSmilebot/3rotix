import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import VideosGrid from '../../components/VideosGrid';
import { getSupabaseClient } from '../../utils/supabase/client';
import { prisma } from '../../lib/prisma';

export async function getServerSideProps({ params }) {
  const { handle } = params;
  
  // Query your Prisma User model instead of Supabase profiles table
  const profile = await prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      bio: true,
      image: true,
      twitter: true,
      instagram: true,
      website: true,
      role: true,
      level: true,
      rank: true,
      totalXp: true,
    }
  });

  if (!profile) {
    return { notFound: true };
  }
  
  return { 
    props: { 
      profile: JSON.parse(JSON.stringify(profile)) // Serialize dates
    } 
  };
}

export default function PublicProfile({ profile }) {
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState([]);
  const [images, setImages] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [tipMessage, setTipMessage] = useState('');
  const [tipping, setTipping] = useState(false);
  const [sendingDM, setSendingDM] = useState(false);
  
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    async function checkOwnership() {
      const { data } = await supabase.auth.getUser();
      if (data?.user && data.user.id === profile.id) {
        setIsOwner(true);
      }
    }
    checkOwnership();
  }, [profile.id]);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      try {
        // Fetch all public content in parallel
        const [videosRes, audioRes, imagesRes] = await Promise.all([
          fetch(`/api/videos?userId=${profile.id}&visibility=public`),
          fetch(`/api/audio?userId=${profile.id}&visibility=public`),
          fetch(`/api/images?userId=${profile.id}&visibility=public`),
        ]);

        const [videosData, audioData, imagesData] = await Promise.all([
          videosRes.json(),
          audioRes.json(),
          imagesRes.json(),
        ]);

        setVideos(videosData || []);
        setAudio(audioData || []);
        setImages(imagesData || []);
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [profile.id]);

  async function handleSendTip() {
    if (!tipAmount || tipAmount <= 0) {
      return alert('Please enter a valid tip amount');
    }

    setTipping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please log in to send a tip');
        setTipping(false);
        return;
      }

      const res = await fetch('/api/tips/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          creatorId: profile.id,
          amount: parseInt(tipAmount),
          message: tipMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send tip');
      }

      alert(`🎉 Tip sent! You tipped ${tipAmount} Lipz to ${profile.name || profile.handle}`);
      setShowTipModal(false);
      setTipAmount(10);
      setTipMessage('');
    } catch (err) {
      console.error('Tip error:', err);
      alert(err.message || 'Failed to send tip');
    } finally {
      setTipping(false);
    }
  }

  async function handleSendDM() {
    setSendingDM(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please log in to send a message');
        setSendingDM(false);
        return;
      }

      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientUsername: profile.handle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      // Redirect to the conversation
      window.location.href = `/messages/${data.conversationId}`;
    } catch (err) {
      console.error('DM error:', err);
      alert(err.message || 'Failed to start conversation');
    } finally {
      setSendingDM(false);
    }
  }

  const { handle, name, bio, image, twitter, instagram, website, level, rank } = profile;

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

  const videoCount = videos.length;
  const audioCount = audio.length;
  const imageCount = images.length;
  const streamCount = streams.length;

  return (
    <>
      <Head>
        <title>{name || handle} — 3rotix</title>
        <meta name="description" content={bio ? bio.slice(0, 150) : `${name || handle} on 3rotix`} />
        <meta property="og:title" content={`${name || handle} — 3rotix`} />
        <meta property="og:description" content={bio ? bio.slice(0, 150) : ''} />
        {image && <meta property="og:image" content={image} />}
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
                href="/dashboard"
                style={{
                  ...editProfileBtn,
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.18)',
                  color: 'rgb(180, 132, 255)'
                }}
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 14h4V7H7v7zM13 18h4V10h-4v8z" />
                </svg>
                Dashboard
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 160, height: 160, borderRadius: '50%', overflow: 'hidden',
              background: '#111', border: '1px solid #333', display: 'grid', placeItems: 'center'
            }}>
              {image ? (
                <img src={image} alt={`${handle} avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#666', fontSize: 12 }}>No photo</span>
              )}
            </div>

            <div>
              <h1 style={{ margin: 0 }}>{name || handle}</h1>
              <div style={{ opacity: 0.8 }}>@{handle}</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
                Level {level} • {rank}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {!isOwner && (
                  <>
                    <button
                      onClick={handleSendDM}
                      disabled={sendingDM}
                      style={{
                        ...linkBtn,
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: 'rgb(59, 130, 246)',
                        cursor: sendingDM ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        opacity: sendingDM ? 0.5 : 1,
                      }}
                    >
                      💬 Message
                    </button>
                    <button
                      onClick={() => setShowTipModal(true)}
                      style={{
                        ...linkBtn,
                        background: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        color: 'rgb(236, 72, 153)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      💰 Send Tip
                    </button>
                  </>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                    🌐 Website
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                    🐦 Twitter
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                    📷 Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {bio && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{bio}</p>}
        </div>

        {/* Content Tabs */}
        <div style={{ marginTop: 40, borderBottom: '1px solid #2a2a2a' }}>
          <nav style={{ display: 'flex', gap: 24, overflow: 'auto' }}>
            {[
              { id: 'videos', label: 'Videos', count: videoCount },
              { id: 'audio', label: 'Audio', count: audioCount },
              { id: 'images', label: 'Images', count: imageCount },
              { id: 'streams', label: 'Past Streams', count: streamCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #ec4899' : '2px solid transparent',
                  color: activeTab === tab.id ? '#ec4899' : '#999',
                  cursor: 'pointer',
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Grid */}
        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              Loading content...
            </div>
          ) : (
            <>
              {activeTab === 'videos' && (
                videos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    No public videos yet.
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: 16 
                  }}>
                    {videos.map((video) => (
                      <div key={video.id} style={{ 
                        background: '#111', 
                        border: '1px solid #333', 
                        borderRadius: 8, 
                        overflow: 'hidden' 
                      }}>
                        {video.playbackId ? (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                            <iframe
                              src={`https://lvpr.tv?v=${video.playbackId}&autoplay=false&muted=false`}
                              allow="encrypted-media; picture-in-picture"
                              allowFullScreen
                              style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                width: '100%', 
                                height: '100%',
                                border: 0
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ 
                            paddingBottom: '56.25%', 
                            background: '#000', 
                            display: 'grid', 
                            placeItems: 'center',
                            color: '#666',
                            fontSize: 12
                          }}>
                            Processing...
                          </div>
                        )}
                        <div style={{ padding: 12 }}>
                          <h3 style={{ margin: 0, fontSize: 14 }}>{video.title || 'Untitled'}</h3>
                          {video.description && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'audio' && (
                audio.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    No public audio yet.
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: 16 
                  }}>
                    {audio.map((track) => (
                      <div key={track.id} style={{ 
                        background: '#111', 
                        border: '1px solid #333', 
                        borderRadius: 8, 
                        padding: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'rgba(236, 72, 153, 0.1)',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            display: 'grid',
                            placeItems: 'center',
                          }}>
                            ♪
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: 14 }}>{track.title || 'Untitled'}</h3>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666' }}>
                              {track.createdAt ? new Date(track.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        {track.playbackId && (
                          <iframe
                            src={`https://lvpr.tv/?v=${track.playbackId}&autoplay=0&muted=0`}
                            style={{ width: '100%', height: 80, border: 0, borderRadius: 4 }}
                            allow="encrypted-media; picture-in-picture"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'images' && (
                images.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    No public images yet.
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                    gap: 16 
                  }}>
                    {images.map((img) => (
                      <div key={img.id} style={{ 
                        background: '#111', 
                        border: '1px solid #333', 
                        borderRadius: 8, 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ position: 'relative', paddingBottom: '100%', background: '#000' }}>
                          <img
                            src={img.url}
                            alt={img.title || 'Image'}
                            style={{ 
                              position: 'absolute', 
                              inset: 0, 
                              width: '100%', 
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                        <div style={{ padding: 12 }}>
                          <h3 style={{ margin: 0, fontSize: 14 }}>{img.title || 'Untitled'}</h3>
                          {img.description && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                              {img.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'streams' && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  Past streams coming soon.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowTipModal(false)}
        >
          <div
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>
              Send Tip to {name || handle}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#999' }}>
                Lipz Amount
              </label>
              <input
                type="number"
                min="1"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#000',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 16,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(amt)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: tipAmount == amt ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + (tipAmount == amt ? 'rgba(236, 72, 153, 0.5)' : '#333'),
                      borderRadius: 6,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#999' }}>
                Message (optional)
              </label>
              <textarea
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                placeholder="Say something nice..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#000',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowTipModal(false)}
                disabled={tipping}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #333',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: tipping ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  opacity: tipping ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendTip}
                disabled={tipping || !tipAmount || tipAmount <= 0}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(236, 72, 153, 0.9)',
                  border: '1px solid rgba(236, 72, 153, 0.5)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: tipping || !tipAmount || tipAmount <= 0 ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  opacity: tipping || !tipAmount || tipAmount <= 0 ? 0.5 : 1,
                }}
              >
                {tipping ? 'Sending...' : `Send ${tipAmount} Lipz`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}