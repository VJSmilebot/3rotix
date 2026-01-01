import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function NewDMPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const res = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipient: recipient.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert(data.error || 'Failed to create conversation');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Message - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">New Message</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient (handle or email)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="@handle or email@example.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !recipient.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Start Conversation'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
