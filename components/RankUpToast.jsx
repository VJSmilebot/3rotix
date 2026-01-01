// /components/RankUpToast.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Tiny glow frame (gradient border without extra libs)
function GlowFrame({ children }) {
  return (
    <div className="relative">
      {/* outer glow */}
      <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-500 opacity-60 blur-md" />
      {/* card */}
      <div className="relative rounded-2xl border border-white/15 bg-black/85 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}

/**
 * Props:
 *   trigger: { rankUp: boolean, newRank: "ROOKIE"|"CREW"|"CULT"|"ICONIC" }
 *   onClose?(): optional callback when toast closes
 */
export default function RankUpToast({ trigger, onClose }) {
  const [open, setOpen] = useState(false);
  const [rank, setRank] = useState(null);
  const prefersReduced = useReducedMotion();

  // Open toast whenever trigger indicates a rank-up
  useEffect(() => {
    if (trigger?.rankUp) {
      setRank(trigger.newRank);
      setOpen(true);
      const t = setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, 5500);
      return () => clearTimeout(t);
    }
  }, [trigger, onClose]);

  // Motion variants
  const variants = {
    initial: { opacity: 0, y: prefersReduced ? 0 : 24, scale: prefersReduced ? 1 : 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 420, damping: 26, duration: prefersReduced ? 0 : 0.5 },
    },
    exit: {
      opacity: 0,
      y: prefersReduced ? 0 : 16,
      scale: prefersReduced ? 1 : 0.98,
      transition: { duration: prefersReduced ? 0 : 0.18 },
    },
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-0 bottom-4 z-[9999] flex justify-center px-3 pointer-events-none"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="rankup"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pointer-events-auto w-full max-w-sm"
          >
            <GlowFrame>
              <div className="flex items-start gap-3 p-4">
                {/* icon */}
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-pink-400">
                    <path
                      fill="currentColor"
                      d="m12 2l2.39 4.84L20 7.27l-3.64 3.55L17.5 16L12 13.27L6.5 16l1.14-5.18L4 7.27l5.61-.43L12 2Z"
                    />
                  </svg>
                </div>

                {/* text */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white">
                    <span className="font-semibold text-pink-400">Rank up!</span>{" "}
                    You’re now <span className="font-semibold">{rank}</span>. Keep going. 💥
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Next milestones: <span className="tabular-nums">200</span> /{" "}
                    <span className="tabular-nums">500</span> /{" "}
                    <span className="tabular-nums">1000</span> XP
                  </div>
                </div>

                {/* close */}
                <button
                  aria-label="Close"
                  onClick={() => {
                    setOpen(false);
                    onClose?.();
                  }}
                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59L7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                    />
                  </svg>
                </button>
              </div>
            </GlowFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
