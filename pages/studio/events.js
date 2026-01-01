import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadEvents(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadEvents(userId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/by-creator/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to manage events.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Events - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Events</h1>
              <p className="text-gray-400 mt-1">Create and manage your ticketed events</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all shadow-lg shadow-purple-500/30"
            >
              + Create Event
            </button>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">You haven't created any events yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEvents(user.id);
          }}
        />
      )}
    </>
  );
}

function EventCard({ event }) {
  const statusColors = {
    UPCOMING: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    LIVE: 'bg-green-600/20 text-green-400 border-green-600/30',
    ENDED: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
    CANCELLED: 'bg-red-600/20 text-red-400 border-red-600/30',
  };

  const ticketsRemaining = event.totalTickets 
    ? event.totalTickets - event.soldTickets 
    : null;

  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-purple-600/30 transition-all">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
            🎫
          </div>
        )}
        <div className="absolute top-3 right-3 px-3 py-1 bg-purple-600 rounded-full text-xs font-bold">
          {event.price} Lipz
        </div>
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[event.status]}`}>
          {event.status}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
        {event.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <span>📅</span>
            <span>{new Date(event.eventDate).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-gray-500">
              {event._count?.purchases || 0} tickets sold
            </div>
            {ticketsRemaining !== null && (
              <div className={`text-xs font-bold ${
                ticketsRemaining === 0 
                  ? 'text-red-400' 
                  : ticketsRemaining < 10 
                  ? 'text-yellow-400' 
                  : 'text-gray-400'
              }`}>
                {ticketsRemaining === 0 ? 'SOLD OUT' : `${ticketsRemaining} left`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(50);
  const [totalTickets, setTotalTickets] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  // Set default date to tomorrow at 8 PM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    setEventDate(tomorrow.toISOString().slice(0, 16));
  }, []);

  async function handleCreate() {
    if (!title || !price || !eventDate) {
      return alert('Please fill in title, price, and event date');
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in');
        return;
      }

      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: parseInt(price),
          totalTickets: totalTickets ? parseInt(totalTickets) : null,
          eventDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create event');
      }

      alert('Event created successfully! 🎉');
      onSuccess();
    } catch (err) {
      console.error('Error creating event:', err);
      alert(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Exclusive Live Stream Q&A"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-600 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell attendees what to expect..."
              rows={4}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-600 outline-none resize-none"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Date & Time</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-600 outline-none"
            />
          </div>

          {/* Price & Tickets */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (Lipz)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Tickets <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="number"
                value={totalTickets}
                onChange={(e) => setTotalTickets(e.target.value)}
                min="1"
                placeholder="Unlimited"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4 text-sm text-purple-300">
            💡 <strong>Tip:</strong> After creating the event, you can add a stream URL from your streaming dashboard when you're ready to go live.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title || !price || !eventDate}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}