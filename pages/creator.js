import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSupabaseClient } from '../utils/supabase/client';
import VideoUploader from '../components/VideoUploader';

export default function CreatorPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    handle: '',
    twitter: '',
    instagram: '',
    website: '',
  });
  const [myVideos, setMyVideos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, handle, twitter, instagram, website')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      await refreshMyVideos(user.id);
      setLoading(false);
    };

    loadUserData();
  }, [router, supabase]);

  const refreshMyVideos = async (userId) => {
    if (!userId) return;
    const { data: vids } = await supabase
      .from('videos')
      .select('id, title, playback_id, visibility, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setMyVideos(vids || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    
    setSaving(false);
    if (error) {
      alert(error.message);
    } else {
      alert('Profile saved!');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-sm">Photo</span>
                            )}
                        </div>
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-pink-600 rounded-full p-2 cursor-pointer hover:bg-pink-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                        <input type="text" id="display_name" name="display_name" value={profile.display_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md" />
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="handle" className="block text-sm font-medium text-gray-300 mb-1">Handle</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-700 rounded-l-md text-gray-400">@</span>
                            <input type="text" id="handle" name="handle" value={profile.handle || ''} onChange={handleInputChange} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-r-md" />
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                    <textarea id="bio" name="bio" value={profile.bio || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md" />
                </div>

                {/* Social Links */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">Website URL</label>
                        <input type="url" id="website" name="website" value={profile.website || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1">Twitter URL</label>
                        <input type="url" id="twitter" name="twitter" value={profile.twitter || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-1">Instagram URL</label>
                        <input type="url" id="instagram" name="instagram" value={profile.instagram || ''} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md" />
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={saving} className="w-full md:w-auto py-2 px-6 bg-pink-600 hover:bg-pink-500 rounded-md font-medium disabled:opacity-70">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>

        <VideoUploader onFinished={() => refreshMyVideos(user?.id)} />

        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">My Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(myVideos || []).map((v) => (
                    <div key={v.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="font-bold truncate">{v.title || 'Untitled'}</div>
                        <div className="text-sm opacity-70 mb-2 uppercase">{v.visibility || 'PUBLIC'}</div>
                        {v.playback_id ? (
                            <Link href={`/watch/${v.playback_id}`} className="text-pink-400 hover:underline">Watch →</Link>
                        ) : (
                            <span className="opacity-50">Processing...</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}