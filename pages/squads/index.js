import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Link from 'next/link';

export default function SquadsPage() {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch all squads
      const res = await fetch('/api/squads');
      if (res.ok) {
        const data = await res.json();
        setSquads(data);
      }
    } catch (error) {
      console.error('Error loading squads:', error);
    } finally {
      setLoading(false);
    }
  }

  // Add console logs to see what's happening
  useEffect(() => {
    async function fetchSquads() {
      try {
        console.log('🔍 Fetching squads from frontend...');
        const res = await fetch('/api/squads');
        console.log('📡 Response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Received squads:', data.length);
          console.log('📦 First squad:', data[0]);
          setSquads(data);
        } else {
          const error = await res.text();
          console.error('❌ Error response:', error);
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSquads();
  }, []);

  if (loading) {
    return (
      <main style={styles.container}>
        <div style={styles.loading}>Loading squads...</div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Squads</h1>
        {user && (
          <Link href="/squads/create" style={styles.createBtn}>
            + Create Squad
          </Link>
        )}
      </div>

      <div style={styles.grid}>
        {squads.map(squad => (
          <Link 
            key={squad.id} 
            href={`/squads/${squad.slug}`}
            style={styles.card}
          >
            <div style={styles.cardHeader}>
              <h2 style={styles.squadName}>{squad.name}</h2>
              <div style={styles.level}>Lv {squad.level || 1}</div>
            </div>
            
            <p style={styles.description}>
              {squad.description || 'No description'}
            </p>

            <div style={styles.stats}>
              <div>👥 {squad._count?.members || 0} members</div>
              <div>🏆 {squad.totalXp || 0} XP</div>
            </div>

            {squad.owner && (
              <div style={styles.owner}>
                <img 
                  src={squad.owner.image || '/default-avatar.png'} 
                  alt={squad.owner.name}
                  style={styles.ownerAvatar}
                />
                <div style={styles.ownerName}>
                  {squad.owner.name || squad.owner.handle}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {squads.length === 0 && (
        <div style={styles.empty}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🏆</p>
          <p>No squads yet. Be the first to create one!</p>
        </div>
      )}
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    margin: 0,
  },
  createBtn: {
    background: 'linear-gradient(135deg, #db2777, #9333ea)',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  loading: {
    display: 'grid',
    placeItems: 'center',
    minHeight: 400,
    color: '#666',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 20,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.2s',
    cursor: 'pointer',
    display: 'block',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  squadName: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  level: {
    background: 'linear-gradient(135deg, #db2777, #9333ea)',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  description: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  stats: {
    display: 'flex',
    gap: 16,
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  owner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #222',
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  ownerName: {
    fontSize: 12,
    color: '#666',
  },
  empty: {
    display: 'grid',
    placeItems: 'center',
    minHeight: 400,
    color: '#666',
    textAlign: 'center',
  },
};