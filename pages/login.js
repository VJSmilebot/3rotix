import { useRouter } from 'next/router';
import { useState } from 'react';
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


async function handleSubmit(e) {
e.preventDefault();
setLoading(true);
setError('');
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
setError(error.message);
setLoading(false);
return;
}
// hard reload so SSR immediately sees cookies
window.location.replace(next);
}


return (
<div className="min-h-screen flex items-center justify-center bg-gray-900">
<div className="max-w-md w-full space-y-6 p-8 bg-gray-800 rounded-lg">
<h1 className="text-white text-2xl font-semibold text-center">Log in</h1>
{error && (
<div className="bg-red-500/10 text-red-400 border border-red-500 p-3 rounded">{error}</div>
)}
<form onSubmit={handleSubmit} className="space-y-4">
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