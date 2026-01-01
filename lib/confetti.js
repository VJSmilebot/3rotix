// /lib/confetti.js
import confetti from "canvas-confetti";

export function burstConfetti() {
  const end = Date.now() + 500;
  const colors = ["#FF007A", "#9F00FF", "#00F5FF", "#FFFFFF"];
  (function frame() {
    confetti({
      particleCount: 40,
      startVelocity: 32,
      spread: 60,
      ticks: 90,
      gravity: 1.0,
      colors,
      scalar: 0.8,
      origin: { y: 0.8 }
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
