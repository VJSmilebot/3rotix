import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';

export default function Login() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextParam = typeof router.query.next === 'string' ? router.query.next : '';
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/creator';

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // CHANGED: router.push(next) to window.location.href
          window.location.href = next;
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkSession();
  }, [next]); // Added next as dependency

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      console.log("Authentication successful", data);

      // Get the user's handle from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Already using direct navigation - good!
      if (profileData?.handle) {
        console.log("User has handle, navigating to profile");
        window.location.href = `/c/${profileData.handle}`;
      } else {
        console.log("User has no handle, navigating to creator page");
        window.location.href = '/creator';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }


return (
<div className="min-h-screen flex items-center justify-center bg-gray-900">
<div className="max-w-md w-full space-y-6 p-8 bg-gray-800 rounded-lg">
<h1 className="text-white text-2xl font-semibold text-center">Log in</h1>
{error && (
<div className="bg-red-500/10 text-red-400 border border-red-500 p-3 rounded">{error}</div>
)}
<form onSubmit={handleSignIn} className="space-y-4">
<div>
<label htmlFor="email" className="block text-sm text-white">Email</label>
<input
id="email"
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
className="mt-1 w-full rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring"
autoComplete="email"
required
/>
</div>
<div>
<label htmlFor="password" className="block text-sm text-white">Password</label>
<input
id="password"
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="mt-1 w-full rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring"
autoComplete="current-password"
required
/>
</div>
<button
type="submit"
disabled={loading}
className="w-full py-2 rounded-md bg-pink-600 text-white font-medium disabled:opacity-50"
>
{loading ? 'Logging in…' : 'Log in'}
</button>
</form>
</div>
</div>
);
}