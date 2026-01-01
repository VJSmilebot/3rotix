// pages/studio.js
import { useState, useEffect } from 'react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseClient } from '../utils/supabase/client';
import VideoUploader from '../components/VideoUploader';
import AudioUploader from '../components/AudioUploader';
import ImageUploader from '../components/ImageUploader';
import RegisterInVaultButton from "../components/vault/RegisterInVaultButton";
import Head from 'next/head';
import Link from 'next/link';
import cookie from 'cookie';

// --- SERVER SIDE: auth + data fetch ---
export async function getServerSideProps({ req, res }) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.setHeader(
            'Set-Cookie',
            cookie.serialize(name, value, {
              path: '/',
              ...options,
            }),
          );
        },
        remove(name, options) {
          res.setHeader(
            'Set-Cookie',
            cookie.serialize(name, '', {
              path: '/',
              maxAge: 0,
              ...options,
            }),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: videos } = await supabase
    .from('Video')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  const { data: audio } = await supabase
    .from('Audio')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  const { data: images } = await supabase
    .from('Image')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  return {
    props: {
      userId: user.id,
      userSafe: { email: user.email || null },
      profile: profile || null,
      initialVideos: videos || [],
      initialAudio: audio || [],
      initialImages: images || [],
      initialStreams: [],
    },
  };
}

// --- CLIENT SIDE: Content Studio ---
export default function ContentStudio({
  userId,
  userSafe,
  profile,
  initialVideos,
  initialAudio,
  initialImages,
  initialStreams,
}) {
  const fallbackHandleFromEmail = userSafe?.email
    ? userSafe.email.split('@')[0]
    : 'creator';

  const displayName =
    profile?.display_name ||
    profile?.handle ||
    fallbackHandleFromEmail ||
    'Creator';

  const [activeTab, setActiveTab] = useState('videos');
  const [uploadType, setUploadType] = useState('video');
  const [videos, setVideos] = useState(initialVideos || []);
  const [audio, setAudio] = useState(initialAudio || []);
  const [images, setImages] = useState(initialImages || []);
  const [streams, setStreams] = useState(initialStreams || []);
  const [fetchingStreams, setFetchingStreams] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);

  // NEW: which videos are in the Vault
  const [registeredIds, setRegisteredIds] = useState(new Set());

  const supabase = getSupabaseClient();

  const videoCount = videos?.length || 0;
  const audioCount = audio?.length || 0;
  const imageCount = images?.length || 0;
  const streamCount = streams?.length || 0;

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      if (e.key === 'u') {
        setShowUploadModal(true);
      } else if (e.key === 'v') {
        setActiveTab('videos');
      } else if (e.key === 'a') {
        setActiveTab('audio');
      } else if (e.key === 'i') {
        setActiveTab('images');
      } else if (e.key === 's') {
        setActiveTab('pastStreams');
      } else if (e.key === 'c') {
        setActiveTab('collabs');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // NEW: load Vault list and map to a Set of mediaIds (Video IDs)
  useEffect(() => {
    let cancelled = false;

    async function loadVaultRegisteredIds() {
      try {
        const res = await fetch('/api/vault/list');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load vault');
        }

        const items = data.items || [];
        const ids = new Set(
          items
            .filter((w) => w.mediaId)
            .map((w) => w.mediaId)
        );

        if (!cancelled) {
          setRegisteredIds(ids);
        }
      } catch (err) {
        console.error('[Studio] vault list error:', err);
        if (!cancelled) {
          setRegisteredIds(new Set());
        }
      }
    }

    loadVaultRegisteredIds();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchStreams = async () => {
    setFetchingStreams(true);

    try {
      const response = await fetch('/api/livepeer/fetch-streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch streams');
      }

      console.log('Livepeer streams from API:', result.streams);
      setStreams(result.streams || []);

      if (typeof result.total === 'number') {
        alert(`Found ${result.total} stream(s) from Livepeer.`);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setFetchingStreams(false);
    }
  };

  const handleVideoUploadFinished = async () => {
    setShowUploadModal(false);

    const { data } = await supabase
      .from('Video')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    setVideos(data || []);
  };

  const handleAudioUploadFinished = async () => {
    setShowUploadModal(false);

    const { data } = await supabase
      .from('Audio')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    setAudio(data || []);
  };

  const handleImageUploadFinished = async () => {
    setShowUploadModal(false);

    const { data } = await supabase
      .from('Image')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    setImages(data || []);
  };

  const ContentTabs = () => (
    <div className="border-b border-gray-800 mb-6">
      <nav
        className="flex space-x-6 overflow-x-auto no-scrollbar text-sm"
        aria-label="Content Types"
      >
        {[
          { id: 'videos', label: 'Videos' },
          { id: 'audio', label: 'Audio' },
          { id: 'images', label: 'Images' },
          { id: 'pastStreams', label: 'Past Streams' },
          { id: 'collabs', label: 'Collabs' },
          { id: 'other', label: 'Other Media' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const StatPill = ({ label, value }) => (
    <div className="px-3 py-1 rounded-full bg-gray-900/60 border border-gray-700 text-xs text-gray-300 flex items-center gap-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );

  return (
    <>
      <Head>
        <title>Content Studio | 3ROTIX</title>
      </Head>

      <div className="min-h-screen bg-black text-white px-4 py-6 sm:px-6 lg:px-8 relative">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-sm font-bold uppercase">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (displayName || 'C')[0]
              )}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Content Studio</h1>
              <p className="text-xs text-gray-400">
                Logged in as{' '}
                <span className="text-pink-400">@{profile?.handle || fallbackHandleFromEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
  <div className="flex flex-wrap gap-2">
    <StatPill label="Videos" value={videoCount} />
    <StatPill label="Audio" value={audioCount} />
    <StatPill label="Images" value={imageCount} />
    <StatPill label="Past Streams" value={streamCount} />
  </div>
  <div className="flex gap-2">
    {/* Vault button */}
    <Link
      href="/studio/vault"
      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-medium shadow-lg shadow-emerald-500/30"
    >
      Vault
    </Link>

    <Link
      href="/streaming"
      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-sm font-medium shadow-lg shadow-purple-500/30"
    >
      Go Live
    </Link>
    <button
      type="button"
      onClick={() => {
        setUploadType(activeTab === 'audio' ? 'audio' : 'video');
        setShowUploadModal(true);
      }}
      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-sm font-medium shadow-lg shadow-pink-500/30"
    >
      Upload
    </button>
  </div>
</div>
</header>

{/* Tabs */}
<ContentTabs />

        {/* Tab Content */}
        {activeTab === 'videos' && (
          <>
            {videos.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-300 mb-2">No videos uploaded yet.</p>
                <p className="text-xs text-gray-500 mb-4">
                  Drop your first clip, teaser, or full scene to start building your library.
                </p>
                <button
                  onClick={() => {
                    setUploadType('video');
                    setShowUploadModal(true);
                  }}
                  className="px-4 py-2 text-sm rounded-md bg-pink-600 hover:bg-pink-700"
                >
                  Upload a video
                </button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isRegistered={registeredIds.has(video.id)} // NEW
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'audio' && (
          <>
            {audio.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                <h2 className="text-base font-medium mb-2">No audio drops yet.</h2>
                <p className="text-xs text-gray-400 max-w-md mx-auto mb-3">
                  Voice notes, moans, storytime, dirty whispers, BTS clips — they'll all live here.
                </p>
                <button
                  onClick={() => {
                    setUploadType('audio');
                    setShowUploadModal(true);
                  }}
                  className="px-4 py-2 text-sm rounded-md bg-pink-600 hover:bg-pink-700"
                >
                  Upload audio
                </button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {audio.map((track) => (
                  <AudioCard key={track.id} audio={track} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'images' && (
          <>
            {images.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-300 mb-2">No images uploaded yet.</p>
                <p className="text-xs text-gray-500 mb-4">
                  Upload photos, promos, banners, or any visual content.
                </p>
                <button
                  onClick={() => {
                    setUploadType('image');
                    setShowUploadModal(true);
                  }}
                  className="px-4 py-2 text-sm rounded-md bg-pink-600 hover:bg-pink-700"
                >
                  Upload an image
                </button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image) => (
                  <ImageCard key={image.id} image={image} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pastStreams' && (
          <>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-medium">Past Streams</h2>
                <p className="text-xs text-gray-500">
                  Your Livepeer-backed streams and replays. This is your broadcast history.
                </p>
              </div>
              <button
                onClick={fetchStreams}
                disabled={fetchingStreams}
                className={`px-3 py-2 rounded-md text-xs font-medium border ${
                  fetchingStreams
                    ? 'border-gray-600 text-gray-400'
                    : 'border-gray-700 text-gray-200 hover:border-gray-500 hover:text-white'
                }`}
              >
                {fetchingStreams ? 'Checking…' : 'Check for new streams'}
              </button>
            </div>

            {streams.length === 0 ? (
              <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-300 mb-2">No streams found yet.</p>
                <p className="text-xs text-gray-500 mb-4">
                  Once you go live, finished streams and replays will show up here.
                </p>
                <Link
                  href="/streaming"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-700"
                >
                  Start a stream
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {streams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'collabs' && (
          <div className="border border-dashed border-gray-700 rounded-xl p-8">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-base font-medium mb-1">Collab Proposals</h2>
                <p className="text-xs text-gray-400 max-w-md">
                  This will be the hub for incoming & outgoing collab requests, shared projects, and split deals. For
                  now, we're just framing the space.
                </p>
              </div>
              <button
                onClick={() => setShowCollabModal(true)}
                className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-xs font-medium"
              >
                Start a collab
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>Coming soon:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Send structured collab requests to other creators</li>
                <li>Track statuses: pending, accepted, declined</li>
                <li>Auto-create shared folders / draft spaces for accepted collabs</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'other' && (
          <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-2">Additional formats will land here later.</p>
            <p className="text-xs text-gray-500">
              Think: docs, scripts, shot lists, promos, or anything else that supports your content machine.
            </p>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6 relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">Upload content</h2>
                  <p className="text-[11px] text-gray-500">
                    Switch between video and audio. Images will plug into this same flow.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Type picker header */}
              <div className="flex gap-2 mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadType('video')}
                  className={`px-2 py-1 rounded-full border ${
                    uploadType === 'video'
                      ? 'bg-pink-600/20 border-pink-500/60 text-pink-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-200'
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('audio')}
                  className={`px-2 py-1 rounded-full border ${
                    uploadType === 'audio'
                      ? 'bg-pink-600/20 border-pink-500/60 text-pink-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-200'
                  }`}
                >
                  Audio
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('image')}
                  className={`px-2 py-1 rounded-full border ${
                    uploadType === 'image'
                      ? 'bg-pink-600/20 border-pink-500/60 text-pink-300'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-200'
                  }`}
                >
                  Image
                </button>
              </div>

              {uploadType === 'video' && (
                <VideoUploader onFinished={handleVideoUploadFinished} />
              )}
              {uploadType === 'audio' && (
                <AudioUploader userId={userId} onFinished={handleAudioUploadFinished} />
              )}
              {uploadType === 'image' && (
                <ImageUploader userId={userId} onFinished={handleImageUploadFinished} />
              )}
            </div>
          </div>
        )}

        {/* Collab Modal (UI only for now) */}
        {showCollabModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Start a collab</h2>
                <button
                  onClick={() => setShowCollabModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                This is just a visual shell right now. Later, this will send real proposals to other creators via a
                <code className="mx-1 bg-gray-800 px-1 py-0.5 rounded text-[10px]">collabs</code> table.
              </p>
              <form
                className="space-y-3 text-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Collab system is not wired yet, but the UI is ready.');
                  setShowCollabModal(false);
                }}
              >
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Creator handle or ID</label>
                  <input
                    type="text"
                    className="w-full rounded-md bg-black border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    placeholder="@creatorname"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Collab type</label>
                  <select className="w-full rounded-md bg-black border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500">
                    <option>Video</option>
                    <option>Photoset</option>
                    <option>Audio</option>
                    <option>Live stream</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pitch / idea</label>
                  <textarea
                    className="w-full rounded-md bg-black border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    rows={3}
                    placeholder="Tell them what you have in mind, tone, boundaries, etc."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCollabModal(false)}
                    className="px-3 py-1.5 rounded-md border border-gray-700 text-xs text-gray-300 hover:border-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md bg-pink-600 hover:bg-pink-700 text-xs font-medium"
                  >
                    Preview flow
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Floating Upload Button */}
        <button
          type="button"
          onClick={() => {
            setUploadType(activeTab === 'audio' ? 'audio' : 'video');
            setShowUploadModal(true);
          }}
          className="fixed bottom-5 right-5 z-30 rounded-full bg-pink-600 hover:bg-pink-700 px-4 py-3 text-xs font-semibold shadow-lg shadow-pink-500/40"
        >
          Upload
        </button>
      </div>
    </>
  );
}

// --- Video Card ---
function VideoCard({ video, isRegistered }) {
  const created = video.createdAt ? new Date(video.createdAt) : null;
  const createdLabel = created ? created.toLocaleDateString() : 'Unknown date';
  const visibility = video.visibility || video.access_level || 'private';

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex flex-col relative">
      {/* Vault badge */}
      {isRegistered && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-black shadow">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-900" />
          Vault ✓
        </span>
      )}

      <div className="relative pb-[56.25%] bg-black">
        {video.playbackId ? (
          <iframe
            src={`https://lvpr.tv?v=${video.playbackId}&autoplay=false&muted=false`}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Processing...
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium line-clamp-2 mb-1">
          {video.title || 'Untitled video'}
        </h3>
        <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">
          {video.description || 'No description yet.'}
        </p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-gray-400">
          <span>{createdLabel}</span>
          <span
            className={`px-2 py-0.5 rounded-full border ${
              visibility === 'public'
                ? 'border-green-500/60 text-green-300'
                : 'border-gray-600 text-gray-300'
            }`}
          >
            {visibility}
          </span>
        </div>
        <div className="mt-2 flex gap-2 text-[11px]">
          <button className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100">
            Open
          </button>
          <button className="px-2 py-1 rounded-md border border-gray-700 hover:border-gray-500 text-gray-200">
            Edit
          </button>
          <RegisterInVaultButton media={video} isRegistered={isRegistered} />
        </div>
      </div>
    </div>
  );
}

// --- Audio Card ---
function AudioCard({ audio }) {
  const created = audio.createdAt ? new Date(audio.createdAt) : null;
  const createdLabel = created ? created.toLocaleDateString() : 'Unknown date';
  const visibility = audio.visibility || audio.access_level || 'private';
  const hasPlayback = !!audio.playbackId;

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-pink-600/20 border border-pink-500/60 flex items-center justify-center text-[11px] text-pink-200">
            ♪
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium line-clamp-2">
              {audio.title || 'Untitled audio'}
            </h3>
            <p className="text-[11px] text-gray-500">
              {createdLabel} • {visibility}
            </p>
          </div>
        </div>

        {hasPlayback ? (
          <div className="mt-3 rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://lvpr.tv/?v=${audio.playbackId}&autoplay=0&muted=0`}
              className="w-full h-24"
              allow="encrypted-media; picture-in-picture"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="mt-3 h-10 rounded bg-gray-800 flex items-center justify-center text-[11px] text-gray-500">
            Processing audio…
          </div>
        )}

        <div className="mt-3 flex gap-2 text-[11px]">
          <button className="px-2 py-1 rounded-md border border-gray-700 hover:border-gray-500 text-gray-200">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Image Card ---
function ImageCard({ image }) {
  const created = image.createdAt ? new Date(image.createdAt) : null;
  const createdLabel = created ? created.toLocaleDateString() : 'Unknown date';
  const visibility = image.visibility || 'private';

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="relative pb-[100%] bg-black">
        <img
          src={image.url}
          alt={image.title || 'Image'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium line-clamp-2 mb-1">
          {image.title || 'Untitled image'}
        </h3>
        <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">
          {image.description || 'No description yet.'}
        </p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-gray-400">
          <span>{createdLabel}</span>
          <span
            className={`px-2 py-0.5 rounded-full border ${
              visibility === 'public'
                ? 'border-green-500/60 text-green-300'
                : 'border-gray-600 text-gray-300'
            }`}
          >
            {visibility}
          </span>
        </div>
        <div className="mt-2 flex gap-2 text-[11px]">
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100"
          >
            View full
          </a>
          <button className="px-2 py-1 rounded-md border border-gray-700 hover:border-gray-500 text-gray-200">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Stream Card (Past Streams) ---
function StreamCard({ stream }) {
  const created = stream.created_at ? new Date(stream.created_at) : null;
  const createdLabel = created ? created.toLocaleDateString() : 'Unknown date';
  const isLive = stream.status === 'active';

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="relative pb-[56.25%] bg-gray-800">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.name || 'Stream'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            {isLive ? 'Live stream' : 'Stream replay'}
          </div>
        )}
        {isLive && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-600 text-[10px] font-semibold">
            LIVE
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium mb-1 line-clamp-2">
          {stream.name || 'Untitled stream'}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
          <span>{createdLabel}</span>
          <span
            className={`px-2 py-0.5 rounded-full ${
              isLive ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-300'
            }`}
          >
            {isLive ? 'Live' : 'Ended'}
          </span>
        </div>
        <div className="mt-auto flex gap-2 text-[11px]">
          {isLive ? (
            <a
              href={`/watch/live/${stream.stream_key}`}
              className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Watch live
            </a>
          ) : (
            <Link
              href={`/watch/stream/${stream.playbackId || stream.id}`}
              className="px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch replay
            </Link>
          )}
          <button className="px-2 py-1 rounded-md border border-gray-700 hover:border-gray-500 text-gray-200">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
