import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../../utils/supabase/client';

export default function CreateSquadPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    maxMembers: 50,
    isPrivate: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      alert('Squad name is required');
      return;
    }
    if (!formData.slug.trim()) {
      alert('Squad slug is required');
      return;
    }
    if (formData.maxMembers < 2 || formData.maxMembers > 500) {
      alert('Max members must be between 2 and 500');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/squads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerId: user.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create squad');
      }

      const squad = await res.json();
      alert(`Squad created! You earned 50 XP! 🎉`);
      router.push(`/squads/${squad.slug}`);
    } catch (error) {
      console.error('Create squad error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main style={styles.container}>
        <div style={styles.loading}>Checking authentication...</div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>Create a Squad</h1>
        <p style={styles.subtitle}>
          Build your community and earn XP together! 🏆
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Squad Name */}
          <div style={styles.field}>
            <label style={styles.label}>Squad Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Elite Creators"
              style={styles.input}
              maxLength={50}
              required
            />
            <div style={styles.hint}>{formData.name.length}/50</div>
          </div>

          {/* Slug */}
          <div style={styles.field}>
            <label style={styles.label}>URL Slug *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="elite-creators"
              style={styles.input}
              pattern="^[a-z0-9-]+$" // Changed from [a-z0-9-]+
              maxLength={50}
              required
            />
            <div style={styles.hint}>
              Your squad will be at: /squads/{formData.slug || 'your-slug'}
            </div>
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell everyone what your squad is about..."
              style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
              maxLength={500}
            />
            <div style={styles.hint}>{formData.description.length}/500</div>
          </div>

          {/* Max Members */}
          <div style={styles.field}>
            <label style={styles.label}>Max Members</label>
            <input
              type="number"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              min="2"
              max="500"
              style={styles.input}
              required
            />
            <div style={styles.hint}>Between 2 and 500 members</div>
          </div>

          {/* Private Squad */}
          <div style={styles.checkboxField}>
            <input
              type="checkbox"
              name="isPrivate"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <label htmlFor="isPrivate" style={styles.checkboxLabel}>
              Make this squad private (invite-only)
            </label>
          </div>

          {/* XP Reward Notice */}
          <div style={styles.xpNotice}>
            ⭐ Creating a squad earns you <strong>50 XP</strong>!
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? 'Creating Squad...' : 'Create Squad (+50 XP)'}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: 24,
  },
  loading: {
    display: 'grid',
    placeItems: 'center',
    minHeight: 400,
    color: '#666',
  },
  formWrapper: {
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    margin: 0,
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: 12,
    color: '#666',
  },
  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    cursor: 'pointer',
  },
  xpNotice: {
    background: 'linear-gradient(135deg, rgba(219, 39, 119, 0.1), rgba(147, 51, 234, 0.1))',
    border: '1px solid rgba(219, 39, 119, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #db2777, #9333ea)',
    border: 'none',
    borderRadius: 8,
    padding: '14px 24px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};