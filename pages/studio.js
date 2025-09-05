// pages/studio.js
import { useState, useEffect } from 'react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseClient } from '../utils/supabase/client';
import VideoUploader from '../components/VideoUploader';
import Head from 'next/head';
import Link from 'next/link';
import cookie from 'cookie';

export async function getServerSideProps({ req, res }) {
  // Create a server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name]
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', cookie.serialize(name, value, options))
        },
        remove(name, options) {
          res.setHeader('Set-Cookie', cookie.serialize(name, '', { ...options, maxAge: 0 }))
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Load user's content (videos, images, etc.)
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', data.user.id)
    .order('created_at', { ascending: false });

  // Get user profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url')
    .eq('id', data.user.id)
    .single();

  // Also fetch initial streams data
  const { data: streams } = await supabase
    .from('streams')
    .select('*')
    .eq('user_id', data.user.id)
    .order('created_at', { ascending: false });

  return {
    props: {
      userId: data.user.id,
      profile: profile || {},
      initialVideos: videos || [],
      initialStreams: streams || [], // Add this line
    }
  };
}

export default function ContentStudio({ userId, profile, initialVideos, initialStreams }) {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState(initialVideos || []);
  const [streams, setStreams] = useState(initialStreams || []);
  const [fetchingStreams, setFetchingStreams] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const supabase = getSupabaseClient();

  // Fetch streams function
  const fetchStreams = async () => {
    setFetchingStreams(true);
    
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }
      
      const response = await fetch('/api/livepeer/fetch-streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Send user ID in the request body
        body: JSON.stringify({
          userId: userId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch streams');
      }
      
      // Refresh streams data
      const { data: updatedStreams } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      setStreams(updatedStreams || []);
      alert(`Found ${result.streamsAdded} new stream(s)`);
    } catch (error) {
      console.error('Error fetching streams:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setFetchingStreams(false);
    }
  };

  // Handle successful upload
  const handleUploadFinished = async () => {
    setShowUploadModal(false);
    
    // Refresh the videos list
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    setVideos(data || []);
  };

  // Tab component for different media types
  const ContentTabs = () => (
    <div className="border-b border-gray-700 mb-6">
      <nav className="flex space-x-8" aria-label="Content Types">
        <button 
          onClick={() => setActiveTab('videos')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'videos' 
              ? 'border-pink-500 text-pink-500' 
              : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
          }`}
        >
          Videos
        </button>
        <button 
          onClick={() => setActiveTab('streams')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'streams' 
              ? 'border-pink-500 text-pink-500' 
              : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
          }`}
        >
          Streams
        </button>
        <button 
          onClick={() => setActiveTab('images')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'images' 
              ? 'border-pink-500 text-pink-500' 
              : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
          }`}
        >
          Images
        </button>
        <button 
          onClick={() => setActiveTab('other')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'other' 
              ? 'border-pink-500 text-pink-500' 
              : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
          }`}
        >
          Other Media
        </button>
      </nav>
    </div>
  );

  // Content will be displayed based on active tab
  return (
    <>
      <Head>
        <title>Content Studio | 3ROTIX</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Content Studio</h1>
          <div className="flex gap-3">
            <Link 
              href="/streaming"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Go Live
            </Link>
            <button
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium"
              onClick={() => setShowUploadModal(true)}
            >
              Upload New
            </button>
          </div>
        </div>
        
        <ContentTabs />
        
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-medium text-white">Upload Video</h3>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <VideoUploader onFinished={handleUploadFinished} />
              </div>
            </div>
          </div>
        )}
        
        {/* Video Grid */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.filter(v => !v.type || v.type !== 'stream').map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
            {videos.filter(v => !v.type || v.type !== 'stream').length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">You haven't uploaded any videos yet.</p>
                <button
                  className="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload Your First Video
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* NEW: Streams Tab Content */}
        {activeTab === 'streams' && (
          <>
            <div className="mb-4 flex justify-end">
              <button
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
                onClick={fetchStreams}
                disabled={fetchingStreams}
              >
                {fetchingStreams ? 'Fetching...' : 'Refresh Streams'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map(stream => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
              {streams.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400">You haven't created any streams yet.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link 
                      href="/streaming"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                    >
                      Create New Stream
                    </Link>
                    <button
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                      onClick={fetchStreams}
                      disabled={fetchingStreams}
                    >
                      {fetchingStreams ? 'Checking...' : 'Check for Streams'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'images' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Image gallery coming soon!</p>
          </div>
        )}
        
        {activeTab === 'other' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Additional media types coming soon!</p>
          </div>
        )}
      </div>
    </>
  );
}

// Video card component
function VideoCard({ video }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="relative pb-[56.25%]">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title} 
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">No thumbnail</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-white truncate">{video.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-400">
            {new Date(video.created_at).toLocaleDateString()}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            video.visibility === 'public' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
          }`}>
            {video.visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        <div className="mt-4 flex space-x-2">
          <button className="text-sm text-gray-300 hover:text-white">Edit</button>
          <button className="text-sm text-gray-300 hover:text-white">Analytics</button>
          <button className="text-sm text-red-400 hover:text-red-300">Delete</button>
        </div>
      </div>
    </div>
  );
}

// Stream card component
function StreamCard({ stream }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="relative pb-[56.25%]">
        {stream.thumbnail_url ? (
          <img 
            src={stream.thumbnail_url} 
            alt={stream.name || 'Stream'} 
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-700 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{stream.status === 'active' ? 'Live Now' : 'Stream'}</span>
            </div>
          </div>
        )}
        {stream.status === 'active' && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1">
            LIVE
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-white truncate">{stream.name || 'Untitled Stream'}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-400">
            Created {new Date(stream.created_at).toLocaleDateString()}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            stream.status === 'active' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
          }`}>
            {stream.status === 'active' ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="mt-4 flex space-x-2">
          {stream.status === 'active' ? (
            <a 
              href={`/watch/live/${stream.stream_key}`}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Watch Live
            </a>
          ) : (
            <button className="text-sm text-gray-300 hover:text-white">Edit</button>
          )}
          <button className="text-sm text-gray-300 hover:text-white">
            Stream Info
          </button>
          <Link
            href={`/streaming?streamId=${stream.id}`}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Go Live
          </Link>
        </div>
      </div>
    </div>
  );
}