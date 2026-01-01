'use client';

export default function Watermark3rotix({
  position = 'br',                // 'br' | 'bl' | 'tr' | 'tl'
  width = 'clamp(120px,8vw,220px)',
  opacity = 0.9,
  margin = 'clamp(12px,2.4vw,28px)',
}) {
  const posClass =
    position === 'bl' ? 'bottom-0 left-0' :
    position === 'tr' ? 'top-0 right-0' :
    position === 'tl' ? 'top-0 left-0'  :
    'bottom-0 right-0';

  return (
    <div className={`pointer-events-none absolute ${posClass}`} style={{ padding: margin, opacity }} aria-hidden="true">
      <img
        src="/branding/3rotixWatermark.png"
        alt="3ROTIX watermark"
        style={{ width, height: 'auto', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' }}
        draggable={false}
      />
    </div>
  );
}
