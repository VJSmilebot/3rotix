'use client';
import { useEffect, useRef, useState } from 'react';

export default function DeviceCheckModal({ open, onClose, onConfirm }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const rafRef = useRef();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setError('');
        const ms = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;

        // Audio meter
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(ms);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          // Simple peak detection
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            peak = Math.max(peak, Math.abs(data[i] - 128));
          }
          setAudioLevel(Math.min(100, Math.round((peak / 128) * 100)));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.error(e);
        setError('Could not access camera/microphone. Check permissions and try again.');
      }
    })();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101014] p-4 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Pre-flight Check</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500"
            aria-label="Close device check"
          >
            ✕
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="mt-4">
              <label className="text-sm text-white/80">Mic level</label>
              <div className="h-2 rounded bg-white/10 mt-1 overflow-hidden">
                <div
                  className="h-2 bg-pink-500 transition-[width]"
                  style={{ width: `${audioLevel}%` }}
                  aria-label={`Microphone level ${audioLevel}%`}
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                Tip: Use headphones to avoid echo. Chrome on desktop offers the most stable WebRTC performance.
              </p>
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          <button
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-pink-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-500 focus:ring-2 focus:ring-pink-500"
            onClick={() => { onConfirm?.(); onClose?.(); }}
          >
            Looks good
          </button>
        </div>
      </div>
    </div>
  );
}
