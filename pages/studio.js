// pages/studio.js
import { useState } from 'react';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseClient } from '../utils/supabase/client';
import Head from 'next/head';
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

  return {
    props: {
      userId: data.user.id,
      profile: profile || {},
      initialVideos: videos || [],
    }
  };
}

export default function ContentStudio({ userId, profile, initialVideos }) {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Content Studio</h1>
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium"
            onClick={() => {/* Upload modal handler */}}
          >
            Upload New
          </button>
        </div>
        
        <ContentTabs />
        
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
            {videos.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">You haven't uploaded any videos yet.</p>
                <button
                  className="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  onClick={() => {/* Upload handler */}}
                >
                  Upload Your First Video
                </button>
              </div>
            )}
          </div>
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