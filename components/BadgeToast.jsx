// /components/BadgeToast.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const BADGE_META = {
  FIRST_XP:     { label: "The Initiate",        desc: "First XP.",            image: "/badges/firstxp.png" },
  CREW_200:     { label: "Crew",                desc: "200 total XP.",        image: "/badges/crew200.png" },
  CULT_500:     { label: "Cult",                desc: "500 total XP.",        image: "/badges/cult500.png" },
  ICONIC_1000:  { label: "Iconic",              desc: "1000 total XP.",       image: "/badges/iconic1000.png" },
  MONTH_500:    { label: "Monthly Grinder",     desc: "500 XP this month.",   image: "/badges/month500.png" },
};

export default function BadgeToast({ newBadges = [], onClose }) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (newBadges?.length) {
      setQueue((q) => [...q, ...newBadges]);
      setOpen(true);
    }
  }, [newBadges]);

  useEffect(() => {
    if (!open || queue.length === 0) return;
    const t = setTimeout(() => {
      setQueue((q) => q.slice(1));
      if (queue.length <= 1) {
        setOpen(false);
        onClose?.();
      }
    }, 5500); // visible time
    return () => clearTimeout(t);
  }, [open, queue, onClose]);

  const variants = {
    initial: { opacity: 0, y: prefersReduced ? 0 : 24, scale: prefersReduced ? 1 : 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 26 } },
    exit:    { opacity: 0, y: prefersReduced ? 0 : 16, scale: prefersReduced ? 1 : 0.98, transition: { duration: 0.18 } },
  };

  const current = queue[0];
  const meta = current ? (BADGE_META[current] || { label: current, desc: "", image: null }) : null;

  return (
    <div aria-live="polite" aria-atomic="true"
         className="fixed inset-x-0 bottom-20 z-[9999] flex justify-center px-3 pointer-events-none">
      <AnimatePresence>
        {open && current && (
          <motion.div key={current} variants={variants} initial="initial" animate="animate" exit="exit"
                      className="pointer-events-auto w-full max-w-md">
            <div className="relative">
              {/* neon aura */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-500 opacity-60 blur-md" />
              <div className="relative rounded-2xl border border-white/15 bg-black/85 backdrop-blur-md p-4">
                <div className="flex items-center gap-3">
                  {/* badge image */}
                  <div className="relative h-12 w-12 shrink-0 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center">
                    {meta?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={meta.image} alt="" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(255,0,179,0.7)]" />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" className="text-pink-400">
                        <path fill="currentColor" d="m12 2l2.39 4.84L20 7.27l-3.64 3.55L17.5 16L12 13.27L6.5 16l1.14-5.18L4 7.27l5.61-.43L12 2Z"/>
                      </svg>
                    )}
                  </div>

                  {/* copy */}
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold">
                      🏅 Badge Earned: <span className="text-pink-400">{meta?.label}</span>
                    </div>
                    {meta?.desc && <div className="text-xs text-white/70 mt-0.5">{meta.desc}</div>}
                  </div>

                  {/* close */}
                  <button onClick={() => { setOpen(false); setQueue([]); onClose?.(); }}
                          className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59L7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
