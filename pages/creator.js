// pages/creator.js - Correct implementation for Pages Router
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createServerClient } from '@supabase/ssr'
import { getSupabaseClient } from '../utils/supabase/client';
import { getSupabaseServer } from '../utils/supabase/server'; // Fixed import path
import ProfileImageCropper from '../components/ProfileImageCropper';
import cookie from 'cookie'; // Add this import

export async function getServerSideProps({ req, res }) {
  // Get Supabase server client
  const supabase = getSupabaseServer({ req, res });
  
  // Add error handling and fallback
  try {
    // Check authentication
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        }
      };
    }

    // Get user profile (if needed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    return {
      props: {
        initialUser: session.user || null,
        profile: profile || null
      }
    };
  } catch (err) {
    console.error("Server error:", err);
    
    // Provide fallback props rather than failing completely
    return {
      props: {
        initialUser: null,
        profile: null,
        error: "Failed to load user data"
      }
    };
  }
}

// The rest of your component can stay the same
export default function CreatorPage({ userId, initialProfile, initialVideos }) {
  // Your component code remains unchanged
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  // SIMPLIFIED STATE MANAGEMENT - Just use the profile object
  const [profile, setProfile] = useState(initialProfile || {});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [myVideos, setMyVideos] = useState(initialVideos || []);
  
  // REMOVED individual state variables
  
  // State for image cropping
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  // Keep auth listener alive
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {});
    return () => sub?.subscription?.unsubscribe();
  }, [supabase]);

  // SIMPLIFIED loadUserAndProfile function
  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error loading user:', userError);
          setLoading(false); // Make sure to set loading to false
          window.location.href = '/login'; // Use direct navigation instead of router
          return;
        }
        
        if (!userData?.user) {
          console.log('No authenticated user found');
          setLoading(false); // Make sure to set loading to false
          window.location.href = '/login'; // Use direct navigation instead of router
          return;
        }
        
        setUser(userData.user);
        
        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "no rows returned" error
          console.error('Error loading profile:', profileError);
        }
        
        // Update the profile state if data exists
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        // IMPORTANT: Always set loading to false at the end
        setLoading(false);
      }
    }
    
    loadUserAndProfile();
  }, [supabase]); // Remove router from dependency array since we're using window.location.href

  // Helper functions
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

  // SIMPLIFIED handleInputChange to only update the profile object
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  // Image handling functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create a temporary URL for the cropper
    const objectUrl = URL.createObjectURL(file);
    setTempImageUrl(objectUrl);
    setShowCropper(true);
  };
  
  const handleCropComplete = async (croppedBlob) => {
    setAvatarFile(croppedBlob);
    // Update avatarUrl in the profile object directly
    const objectUrl = URL.createObjectURL(croppedBlob);
    setProfile(prev => ({
      ...prev,
      avatar_url: objectUrl
    }));
    setShowCropper(false);
  };
  
  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUrl(null);
  };
  
  // SIMPLIFIED handleSubmit to only use the profile object
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      if (!user) {
        throw new Error("User is not authenticated");
      }
      
      // Validate handle
      if (!profile.handle || !validateHandle(profile.handle)) {
        throw new Error('Pick a handle: 3–20 letters/numbers/underscore.');
      }
      
      // Check handle uniqueness
      const { data: exists, error: existsErr } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .ilike('handle', profile.handle)
        .maybeSingle();
        
      if (existsErr) {
        throw existsErr;
      }
      
      if (exists) {
        throw new Error('That handle is already taken.');
      }
      
      // Upload avatar if there's a new one
      if (avatarFile) {
        const fileExt = 'jpg'; // We're converting to JPEG in the cropper
        const filePath = `avatars/${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);
          
        // Update profile with new avatar URL
        setProfile(prev => ({
          ...prev,
          avatar_url: data.publicUrl
        }));
      }
      
      // Prepare normalized data for socials
      const updatedProfile = {
        ...profile,
        twitter: profile.twitter ? normalizeTwitter(profile.twitter) : null,
        instagram: profile.instagram ? normalizeInstagram(profile.instagram) : null,
        website: profile.website ? normalizeUrl(profile.website) : null,
        updated_at: new Date().toISOString()
      };
      
      // Update profile in the database
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Redirect to profile page after short delay
      setTimeout(() => {
        window.location.href = `/c/${profile.handle}`; // Use direct navigation instead of router
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // In your component, update the auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Handle sign out
          window.location.href = '/login';
        } else if (!session) {
          // If no session, redirect to login
          window.location.href = '/login';
        } else {
          // User is signed in - load their data
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileData) {
              setProfile(profileData);
            }
            
            setUser(session.user);
          } catch (error) {
            console.error('Error loading profile:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-900/30 border border-red-500' : 'bg-green-900/30 border border-green-500'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm">No photo</span>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-sm text-gray-400">
                Upload a square image for best results.<br />
                You'll be able to crop and position it.
              </div>
            </div>
          </div>
          
          {/* Form fields - only referencing the profile object now */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={profile.display_name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div>
            <label htmlFor="handle" className="block text-sm font-medium text-gray-300 mb-2">Handle</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-700 rounded-l-md text-gray-400">
                @
              </span>
              <input
                type="text"
                id="handle"
                name="handle"
                value={profile.handle || ''}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-r-md text-white"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-2">Twitter URL</label>
            <input
              type="url"
              id="twitter"
              name="twitter"
              value={profile.twitter || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-2">Instagram URL</label>
            <input
              type="url"
              id="instagram"
              name="instagram"
              value={profile.instagram || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
            <input
              type="url"
              id="website"
              name="website"
              value={profile.website || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-500 rounded-md text-white font-medium disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Image cropper modal */}
      {showCropper && tempImageUrl && (
        <ProfileImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}