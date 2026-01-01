import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function ManageCustomRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('PENDING');

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadRequests(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadRequests(userId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-requests/by-creator/${userId}`);
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

  const filteredRequests = requests.filter(r => 
    filter === 'ALL' ? true : r.status === filter
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const acceptedCount = requests.filter(r => r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to manage custom requests.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Custom Requests - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Custom Requests</h1>
            <p className="text-gray-400">Manage personalized content requests from fans</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending" value={pendingCount} color="blue" />
            <StatCard label="In Progress" value={acceptedCount} color="yellow" />
            <StatCard label="Completed" value={completedCount} color="green" />
            <StatCard 
              label="Total Earned" 
              value={`${requests.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + r.budget, 0)} Lipz`}
              color="purple" 
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-gray-400">No {filter.toLowerCase()} requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request}
                  onUpdate={() => loadRequests(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'from-blue-600/20 to-blue-900/20 border-blue-600/30',
    yellow: 'from-yellow-600/20 to-yellow-900/20 border-yellow-600/30',
    green: 'from-green-600/20 to-green-900/20 border-green-600/30',
    purple: 'from-purple-600/20 to-purple-900/20 border-purple-600/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function RequestCard({ request, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [message, setMessage] = useState('');

  const supabase = getSupabaseClient();

  const statusColors = {
    PENDING: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    ACCEPTED: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    IN_PROGRESS: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    COMPLETED: 'bg-green-600/20 text-green-400 border-green-600/30',
    DECLINED: 'bg-red-600/20 text-red-400 border-red-600/30',
    CANCELLED: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  async function handleAccept() {
    if (!deadline) {
      alert('Please set a deadline');
      return;
    }

    setAccepting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/custom-requests/${request.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ deadline }),
      });

      if (!res.ok) throw new Error('Failed to accept');

      alert('Request accepted! ✅');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this request?')) return;

    setDeclining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/custom-requests/${request.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to decline');

      alert('Request declined');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeclining(false);
    }
  }

  async function handleComplete() {
    if (!deliveryUrl) {
      alert('Please provide a delivery URL');
      return;
    }

    if (!confirm('Mark this request as complete and release escrow?')) return;

    setCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/custom-requests/${request.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ deliveryUrl, message }),
      });

      if (!res.ok) throw new Error('Failed to complete');

      alert('Request completed! Payment released 💰');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setCompleting(false);
    }
  }

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

            {/* Pending Actions */}
            {request.status === 'PENDING' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Set Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={accepting || !deadline}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all disabled:opacity-50"
                  >
                    {accepting ? 'Accepting...' : 'Accept Request'}
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={declining}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all disabled:opacity-50"
                  >
                    {declining ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              </div>
            )}

            {/* In Progress Actions */}
            {(request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery URL</label>
                  <input
                    type="url"
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a note for the requester..."
                    rows={2}
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:border-blue-600 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleComplete}
                  disabled={completing || !deliveryUrl}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {completing ? 'Completing...' : 'Mark as Complete & Release Payment'}
                </button>
              </div>
            )}

            {/* Completed Info */}
            {request.status === 'COMPLETED' && (
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
                <p className="text-green-400 font-bold mb-2">✓ Completed</p>
                {request.deliveryUrl && (
                  <a 
                    href={request.deliveryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                  >
                    View Delivery →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}