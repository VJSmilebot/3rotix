import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import Head from 'next/head';

export default function AdminUsers() {
  const { user } = useAuth() ?? {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAndLoadUsers() {
      if (!user) return;
      
      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        alert('Admin access required');
        router.push('/');
        return;
      }
      
      setIsAdmin(true);
      
      // Load all users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      setUsers(profiles || []);
      setLoading(false);
    }
    
    checkAdminAndLoadUsers();
  }, [user?.id, router]);

  async function updateUserRole(userId, newRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  }

  async function toggleCreatorStatus(userId, currentStatus) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_creator: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_creator: !currentStatus } : user
      ));
      
      alert(`Creator status ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      alert(`Error updating creator status: ${err.message}`);
    }
  }

  if (!isAdmin) return <div className="p-8">Checking admin status...</div>;

  return (
    <>
      <Head>
        <title>User Management — 3ROTIX Admin</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0b] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-white/70 mb-6">Manage user roles and permissions</p>
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Creator Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar_url && (
                            <img 
                              src={user.avatar_url} 
                              alt="" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div>{user.handle || user.display_name || 'Unnamed'}</div>
                            <div className="text-xs text-white/50">{user.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role || 'fan'}
                          onChange={e => updateUserRole(user.id, e.target.value)}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1"
                        >
                          <option value="fan">Fan</option>
                          <option value="creator">Creator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={!!user.is_creator}
                            onChange={() => toggleCreatorStatus(user.id, !!user.is_creator)}
                            className="form-checkbox h-5 w-5 accent-pink-600"
                          />
                          <span className="ml-2">
                            {user.is_creator ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/user/${user.id}`)}
                          className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 rounded"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}