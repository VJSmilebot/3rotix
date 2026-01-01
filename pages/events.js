// pages/events.js
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

/**
 * Minimal Monthly Calendar (dark, neon-pink accent)
 * - Keyboard: ← / → to change month, Esc to jump to current month
 * - Monday-first grid
 * - Subtle "today" highlight
 * - No external deps
 */

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

/**
 * Get Monday-first calendar matrix (6 rows x 7 cols).
 * Ensures full grid coverage for any month.
 */
function getCalendarMatrix(activeDate) {
  const firstOfMonth = startOfMonth(activeDate);
  // JS: 0=Sun,1=Mon,...; we want Monday as 1
  const jsWeekday = firstOfMonth.getDay(); // 0..6
  const mondayIndex = (jsWeekday + 6) % 7; // convert so Mon=0..Sun=6
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - mondayIndex); // back to Monday

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  // chunk into 6 weeks
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function Events() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(startOfMonth(today));
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  const weeks = useMemo(() => getCalendarMatrix(viewDate), [viewDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setViewDate((d) => addMonths(d, -1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setViewDate((d) => addMonths(d, 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        setViewDate(startOfMonth(today));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [today]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const [upcomingRes, liveRes] = await Promise.all([
        fetch("/api/events/all?status=UPCOMING"),
        fetch("/api/events/all?status=LIVE"),
      ]);

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingEvents(data);
      }

      if (liveRes.ok) {
        const data = await liveRes.json();
        setLiveEvents(data);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  }

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : liveEvents;

  const isThisMonth =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  return (
    <>
      <Head>
        <title>Event Tickets - 3rotix</title>
      </Head>

      <main className="min-h-[100dvh] bg-[#0b0b0f] text-zinc-200">
        {/* Page container */}
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
          {/* Header */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Calendar of Events & Streams
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Minimal monthly view. No events published yet—stay tuned.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous month"
                onClick={() => setViewDate((d) => addMonths(d, -1))}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-pink-500/60"
              >
                ← Prev
              </button>
              <button
                aria-label="Next month"
                onClick={() => setViewDate((d) => addMonths(d, 1))}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-pink-500/60"
              >
                Next →
              </button>
              <button
                aria-label="Jump to current month"
                onClick={() => setViewDate(startOfMonth(today))}
                disabled={isThisMonth}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-pink-500/60"
              >
                Today
              </button>
            </div>
          </div>

          {/* Month / Year */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-medium tracking-wide">
              <span className="bg-gradient-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                {formatMonthYear(viewDate)}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              Tip: use ← / → to change month • Esc for current
            </div>
          </div>

          {/* Weekday Labels */}
          <div
            className="grid grid-cols-7 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40"
            role="grid"
            aria-label="Monthly calendar"
          >
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                role="columnheader"
                className="border-b border-zinc-800 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                {d}
              </div>
            ))}

            {/* Days Grid */}
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                const inCurrentMonth = date.getMonth() === viewDate.getMonth();
                const isToday = isSameDay(date, today);

                return (
                  <div
                    key={`${wi}-${di}`}
                    role="gridcell"
                    aria-selected={isToday ? "true" : "false"}
                    tabIndex={0}
                    className={[
                      "relative min-h-[88px] border-t border-zinc-900/70 p-2 outline-none",
                      di !== 0 ? "border-l border-zinc-900/70" : "",
                      "focus:z-10 focus:ring-2 focus:ring-pink-500/60",
                      inCurrentMonth
                        ? "bg-transparent"
                        : "bg-zinc-950/40 text-zinc-500",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={[
                          "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs",
                          isToday
                            ? "bg-pink-500/20 text-pink-300 ring-1 ring-inset ring-pink-500/40"
                            : inCurrentMonth
                            ? "text-zinc-300"
                            : "text-zinc-500",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </div>
                      {/* Placeholder dot area for future events */}
                      <div className="mt-1 flex gap-1">
                        {/* empty for now */}
                      </div>
                    </div>

                    {/* Empty cell body — reserved for future event chips */}
                    <div className="mt-2 h-10 rounded-lg border border-dashed border-zinc-800/60 bg-zinc-950/20" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footnote */}
          <p className="mt-4 text-center text-xs text-zinc-500">
            Calendar view is live. Events & streams will appear here when announced.
          </p>
        </div>

        {/* Events Marketplace */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Event Tickets 🎫</h1>
            <p className="text-gray-400">
              Get access to exclusive live streams and events
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeTab === "upcoming"
                  ? "border-purple-600 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeTab === "live"
                  ? "border-green-600 text-green-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Live Now ({liveEvents.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              Loading events...
            </div>
          ) : displayEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎫</div>
              <p className="text-gray-400 mb-2">
                {activeTab === "live"
                  ? "No events are live right now"
                  : "No upcoming events yet"}
              </p>
              <p className="text-gray-500 text-sm">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function EventCard({ event }) {
  const ticketsRemaining = event.totalTickets
    ? event.totalTickets - event.soldTickets
    : null;

  const isSoldOut = ticketsRemaining === 0;
  const isAlmostSoldOut = ticketsRemaining !== null && ticketsRemaining < 10;

  return (
    <Link href={`/events/${event.id}`} className="group">
      <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-purple-600/50 transition-all hover:shadow-xl hover:shadow-purple-600/10">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
              🎫
            </div>
          )}

          {event.status === "LIVE" && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-green-600 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              LIVE NOW
            </div>
          )}

          <div className="absolute top-3 right-3 px-3 py-1 bg-purple-600 rounded-full text-xs font-bold">
            {event.price} Lipz
          </div>

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <span className="text-2xl font-bold text-red-400">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 group-hover:text-purple-400 transition-colors">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span>📅</span>
              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span>🕐</span>
              <span>
                {new Date(event.eventDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-gray-500">
                {event._count?.purchases || 0} attending
              </div>
              {!isSoldOut && isAlmostSoldOut && (
                <div className="text-xs font-bold text-yellow-400">
                  Only {ticketsRemaining} left!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
