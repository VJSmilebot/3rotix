// pages/events.js
import { useEffect, useMemo, useState } from "react";

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

  const isThisMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  return (
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
                    inCurrentMonth ? "bg-transparent" : "bg-zinc-950/40 text-zinc-500",
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
    </main>
  );
}
