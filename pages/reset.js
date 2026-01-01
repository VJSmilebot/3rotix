// pages/reset.js
import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';

export default function ResetRequestPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'sent' | 'error' | null

  const sendReset = async (e) => {
    e.preventDefault();
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) setStatus('error');
    else setStatus('sent');
  };

  const input = {
    width: '100%', padding: '10px', border: '1px solid #ccc',
    borderRadius: 6, color: '#000', background: '#fff', marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20 }}>
      <h1>Password reset</h1>
      <p>Enter your account email. We’ll email you a reset link.</p>
      <form onSubmit={sendReset}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          required
        />
        <button type="submit">Send reset link</button>
      </form>

      {status === 'sent' && (
        <p style={{ marginTop: 12 }}>Check your email for the reset link.</p>
      )}
      {status === 'error' && (
        <p style={{ marginTop: 12, color: 'tomato' }}>
          Couldn’t send reset. Double‑check the email and try again.
        </p>
      )}
    </div>
  );
}
