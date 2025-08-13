import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = getSupabaseClient();

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    router.push('/');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    router.push('/creator');
  };

  const inputStyle = {
    display: 'block',
    marginBottom: 10,
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    color: '#000',            // <-- black input text
    backgroundColor: '#fff',
  };

  const labelStyle = { display: 'block', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Login or Sign Up</h1>
      <form>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginBottom: 12 }}>
          <a href="/reset" style={{ fontSize: 14, textDecoration: 'underline' }}>
            Forgot your password?
          </a>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleLogin} type="button">Log In</button>
          <button onClick={handleSignup} type="button">Sign Up</button>
        </div>
      </form>
    </div>
  );
}
