import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../../utils/supabase/client';
import SquadChat from '../../components/SquadChat';

export default function SquadPage() {
  const { query } = useRouter();
  const slug = String(query.slug || '');
  const supabase = getSupabaseClient();
  
  const [squad, setSquad] = useState(null);
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    if (slug) {
      loadSquadData();
    }
  }, [slug]);

  async function loadSquadData() {
    try {
      // Get current user from Supabase auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch squad by slug
      const res = await fetch(`/api/squads/by-slug/${slug}`);
      if (!res.ok) {
        console.error('Squad not found');
        setLoading(false);
        return;
      }
      
      const squadData = await res.json();
      setSquad(squadData);

      // Get database user by email
      if (currentUser) {
        const dbUserRes = await fetch(`/api/users/by-email?email=${currentUser.email}`);
        if (dbUserRes.ok) {
          const userData = await dbUserRes.json();
          setDbUser(userData);

          // Check if user is a member
          const memberRes = await fetch(`/api/squads/${squadData.id}/membership?userId=${userData.id}`);
          if (memberRes.ok) {
            const memberData = await memberRes.json();
            console.log('Membership check:', memberData);
            setIsMember(memberData.isMember);
            setMembership(memberData.membership);
          }
        }
      }
    } catch (error) {
      console.error('Error loading squad:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSquad() {
    if (!user || !dbUser) {
      alert('Please log in to join squads');
      return;
    }

    try {
      const res = await fetch(`/api/squads/${squad.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dbUser.id }),
      });

      if (res.ok) {
        alert('Joined squad! +10 XP');
        loadSquadData(); // Reload to update membership status
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to join squad');
      }
    } catch (error) {
      console.error('Error joining squad:', error);
      alert('Failed to join squad');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '400px', color: '#666' }}>
        Loading...
      </div>
    );
  }

  if (!squad) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '400px', color: '#666' }}>
        Squad not found
      </div>
    );
  }

  const isOwner = dbUser?.id === squad.ownerId;
  const canAccessChat = isMember || isOwner;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Left Column - Chat & Info */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 12, padding: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, marginBottom: 8 }}>
              {squad.name}
            </h1>
            <p style={{ color: '#999', margin: 0 }}>{squad.description}</p>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 14, color: '#666' }}>
              <div>👥 {squad.memberCount || 0} members</div>
              <div>⭐ Level {squad.level || 1}</div>
              <div>🏆 {squad.totalXp || 0} XP</div>
            </div>

            {isOwner && <div style={{ marginTop: 12, color: '#db2777', fontSize: 14 }}>👑 You own this squad</div>}
            {isMember && !isOwner && <div style={{ marginTop: 12, color: '#9333ea', fontSize: 14 }}>✓ Member</div>}
          </div>

          {/* Squad Chat - For members and owner */}
          {canAccessChat && user && dbUser ? (
            <SquadChat
              squadId={squad.id}
              userId={dbUser.id}
              userName={dbUser.name || dbUser.handle}
              userImage={dbUser.image}
              isOwner={isOwner}
              isModerator={membership?.role === 'MODERATOR'}
            />
          ) : (
            <div style={{ 
              background: '#0a0a0a', 
              border: '1px solid #333', 
              borderRadius: 12, 
              padding: 48,
              textAlign: 'center',
              color: '#666'
            }}>
              <p>Join the squad to access chat!</p>
            </div>
          )}
        </section>

        {/* Right Column - Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Join Card */}
          {!canAccessChat && user && (
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: 0, marginBottom: 12 }}>Join Squad</h3>
              <button
                onClick={handleJoinSquad}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #db2777, #9333ea)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Join Now (+10 XP)
              </button>
            </div>
          )}

          {/* Squad Leader */}
          {squad.owner && (
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14, color: '#999' }}>Squad Leader</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={squad.owner.image || '/default-avatar.png'}
                  alt={squad.owner.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{squad.owner.name || squad.owner.handle}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{squad.owner.role}</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}