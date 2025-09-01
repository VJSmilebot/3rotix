import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import Head from 'next/head';

export default function UserDetail() {
  const { user: currentUser } = useAuth() ?? {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    async function checkAdminAndLoadUser() {
      if (!currentUser || !id) return;
      
      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      
      if (profile?.role !== 'admin') {
        alert('Admin access required');
        router.push('/');
        return;
      }
      
      setIsAdmin(true);
      
      // Load user details
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error loading user:', error);
        return;
      }
      
      setUser(userProfile);
      setLoading(false);
    }
    
    checkAdminAndLoadUser();
  }, [currentUser?.id, id, router]);

  async function updateUser(field, value) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setUser({ ...user, [field]: value });
      alert(`User ${field} updated`);
    } catch (err) {
      alert(`Error updating user: ${err.message}`);
    }
  }

  if (!isAdmin) return <div className="p-8">Checking admin status...</div>;
  if (loading) return <div className="p-8">Loading user details...</div>;
  if (!user) return <div className="p-8">User not found</div>;

  return (
    <>
      <Head>
        <title>User Details — 3ROTIX Admin</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0b] text-white p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <button 
              onClick={() => router.push('/admin/users')}
              className="text-white/70 hover:text-white flex items-center gap-1"
            >
              ← Back to users
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt="" 
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.handle || user.display_name || 'Unnamed User'}</h1>
              <p className="text-white/70">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Role</label>
                  <select
                    value={user.role || 'fan'}
                    onChange={e => updateUser('role', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2"
                  >
                    <option value="fan">Fan</option>
                    <option value="creator">Creator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/70 mb-1">Creator Status</label>
                  <div className="flex items-center h-full pt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={!!user.is_creator}
                        onChange={() => updateUser('is_creator', !user.is_creator)}
                        className="form-checkbox h-5 w-5 accent-pink-600"
                      />
                      <span className="ml-2">{user.is_creator ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-white/70 mb-1">Plan Tier</label>
                  <select
                    value={user.plan_tier || 'free'}
                    onChange={e => updateUser('plan_tier', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="creator">Creator</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-white/70 mb-1">Username/Handle</label>
                  <input
                    type="text"
                    value={user.handle || ''}
                    onChange={e => updateUser('handle', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to ban this user?')) {
                      updateUser('banned', true);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 rounded-lg"
                >
                  Ban User
                </button>
                
                {user.banned && (
                  <button 
                    onClick={() => updateUser('banned', false)}
                    className="ml-2 px-4 py-2 bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 rounded-lg"
                  >
                    Unban User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}