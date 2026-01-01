import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../../utils/supabase/client';

export default function EventDetailPage() {
  const router = useRouter();
  const { eventId } = router.query;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  async function loadEvent() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {};
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/events/${eventId}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        setHasPurchased(data.hasPurchased || false);
      } else {
        console.error('Failed to load event');
      }
    } catch (err) {
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('Please log in to purchase a ticket');
      return;
    }

    if (!confirm(`Purchase ticket for "${event.title}" for ${event.price} Lipz?`)) {
      return;
    }

    setPurchasing(true);

    try {
      const res = await fetch(`/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      alert(`🎉 Ticket purchased! See you at "${event.title}"`);
      loadEvent();
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.message || 'Failed to purchase ticket');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  const ticketsRemaining = event.totalTickets 
    ? event.totalTickets - event.soldTickets 
    : null;
  
  const isSoldOut = ticketsRemaining === 0;
  const isLive = event.status === 'LIVE';
  const hasEnded = event.status === 'ENDED';
  const isCancelled = event.status === 'CANCELLED';

  const eventDate = new Date(event.eventDate);
  const timeUntilEvent = eventDate - new Date();
  const daysUntil = Math.floor(timeUntilEvent / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor((timeUntilEvent % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <>
      <Head>
        <title>{event.title} - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Cover Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
              {event.coverImage ? (
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-9xl">
                  🎫
                </div>
              )}
              
              {isLive && (
                <div className="absolute top-4 left-4 px-4 py-2 bg-green-600 rounded-full font-bold animate-pulse flex items-center gap-2">
                  <span className="w-3 h-3 bg-white rounded-full"></span>
                  LIVE NOW
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                <p className="text-gray-400">{event.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📅 Date:</span>
                  <span className="font-bold">{eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">🕐 Time:</span>
                  <span className="font-bold">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">💰 Price:</span>
                  <span className="text-2xl font-bold text-purple-400">{event.price} Lipz</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">👥 Attending:</span>
                  <span className="font-bold">{event._count?.purchases || 0}</span>
                </div>
                {ticketsRemaining !== null && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">🎟️ Available:</span>
                    <span className={`font-bold ${
                      isSoldOut 
                        ? 'text-red-400' 
                        : ticketsRemaining < 10 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`}>
                      {isSoldOut ? 'SOLD OUT' : `${ticketsRemaining} tickets`}
                    </span>
                  </div>
                )}
              </div>

              {/* Countdown */}
              {!hasEnded && !isCancelled && !isLive && timeUntilEvent > 0 && (
                <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4 mb-6">
                  <div className="text-sm text-purple-300 mb-1">Event starts in:</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {daysUntil > 0 && `${daysUntil}d `}
                    {hoursUntil}h
                  </div>
                </div>
              )}

              {/* Purchase/Access Button */}
              {isCancelled ? (
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                  <p className="text-red-400 font-bold">❌ Event Cancelled</p>
                </div>
              ) : hasEnded ? (
                <div className="bg-gray-600/20 border border-gray-600/50 rounded-lg p-4">
                  <p className="text-gray-400 font-bold">Event has ended</p>
                </div>
              ) : hasPurchased ? (
                <div className="space-y-3">
                  <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                    <p className="text-green-400 font-bold">✓ You have a ticket!</p>
                    {isLive ? (
                      <p className="text-sm text-green-300 mt-1">Event is live now - join below</p>
                    ) : (
                      <p className="text-sm text-green-300 mt-1">You'll get access when the event starts</p>
                    )}
                  </div>
                  
                  {isLive && event.streamUrl && (
                    <a
                      href={event.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg text-center transition-all"
                    >
                      🔴 Join Live Stream
                    </a>
                  )}
                </div>
              ) : isSoldOut ? (
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                  <p className="text-red-400 font-bold">Sold Out</p>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Processing...' : `Get Ticket for ${event.price} Lipz`}
                </button>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-6">
              <p className="text-gray-300 leading-relaxed">
                {event.description || 'Join us for this exclusive event!'}
              </p>
              
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="font-bold mb-3">What You'll Get:</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Access to the exclusive live stream</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Ability to interact with the creator in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>VIP access badge on your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    <span>Recording available for 48 hours after the event</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}