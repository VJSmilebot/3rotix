import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';
import Link from 'next/link';

export default function MyCustomRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadRequests();
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/custom-requests/my-requests', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(requestId) {
    if (!confirm('Cancel this request? Your Lipz will be refunded.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/custom-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to cancel');

      alert('Request cancelled. Lipz refunded.');
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredRequests = requests.filter(r => 
    filter === 'ALL' ? true : r.status === filter
  );

  const totalSpent = requests
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.budget, 0);

  const inEscrow = requests
    .filter(r => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status))
    .reduce((sum, r) => sum + r.escrowLipz, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to view your requests.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Custom Requests - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Custom Requests</h1>
              <p className="text-gray-400">Track your personalized content requests</p>
            </div>
            <Link
              href="/creators"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30"
            >
              + New Request
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Total Requests</div>
              <div className="text-3xl font-bold">{requests.length}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">In Escrow</div>
              <div className="text-3xl font-bold text-yellow-400">{inEscrow} Lipz</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Total Spent</div>
              <div className="text-3xl font-bold text-green-400">{totalSpent} Lipz</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-gray-400 mb-4">No custom requests yet</p>
              <Link
                href="/creators"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
              >
                Request Custom Content
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <UserRequestCard 
                  key={request.id} 
                  request={request}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function UserRequestCard({ request, onCancel }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusColors = {
    PENDING: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    ACCEPTED: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    IN_PROGRESS: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    COMPLETED: 'bg-green-600/20 text-green-400 border-green-600/30',
    DECLINED: 'bg-red-600/20 text-red-400 border-red-600/30',
    CANCELLED: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{request.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{request.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <div className="text-xl font-bold text-blue-400">{request.budget} Lipz</div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[request.status]}`}>
              {request.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>📅 {new Date(request.createdAt).toLocaleDateString()}</span>
          {request.deadline && (
            <span>⏰ Due: {new Date(request.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-800 p-4 bg-black/50">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm text-gray-400 mb-2">Full Description</h4>
              <p className="text-gray-300">{request.description}</p>
            </div>

            {request.creatorMessage && (
              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-3">
                <h4 className="font-bold text-sm text-purple-400 mb-1">Creator's Message</h4>
                <p className="text-gray-300 text-sm">{request.creatorMessage}</p>
              </div>
            )}

            {request.status === 'COMPLETED' && request.deliveryUrl && (
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
                <h4 className="font-bold text-green-400 mb-2">✓ Delivered!</h4>
                <a 
                  href={request.deliveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View Your Content →
                </a>
              </div>
            )}

            {request.status === 'PENDING' && (
              <button
                onClick={() => onCancel(request.id)}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all"
              >
                Cancel Request & Get Refund
              </button>
            )}

            {request.status === 'DECLINED' && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3 text-sm text-gray-300">
                This request was declined. Your Lipz have been refunded.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}