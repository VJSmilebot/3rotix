// pages/update-password.js
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { useRouter } from 'next/router';

export default function UpdatePasswordPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);   // becomes true once Supabase sets the session
  const [saving, setSaving] = useState(false);

  // After the user clicks the email link, Supabase sets a session automatically.
  // We poll briefly until it’s ready.
  useEffect(() => {
    let id = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        clearInterval(id);
        setReady(true);
      }
    }, 800);
    return () => clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!password || password !== confirm) {
      alert('Passwords must match.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return alert(error.message);
    alert('Password updated. You’re logged in.');
    router.push('/creator');
  };

  const input = {
    width: '100%', padding: '10px', border: '1px solid #ccc',
    borderRadius: 6, color: '#000', background: '#fff', marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20 }}>
      <h1>Set a new password</h1>
      {!ready ? (
        <p>Preparing your session…</p>
      ) : (
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={input}
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
