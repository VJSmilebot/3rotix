'use client';
import Watermark3rotix from './Watermark3rotix';

export default function OverlayLayer({ config }) {
  const {
    position = 'br',
    size = 'standard',            // 'compact' | 'standard' | 'bold'
    opacity = 0.9,
    marginPx,
    logoUrl = '',
    logoSize = 120,
    logoPosition = 'tl',
    lowerText = '',
    lowerColor = '#ffffff',
    lowerBg = 'rgba(0,0,0,0.35)',
    lowerPos = 'bl',
  } = config || {};

  const width =
    size === 'compact' ? 'clamp(100px,7vw,180px)' :
    size === 'bold'    ? 'clamp(150px,10vw,260px)' :
    'clamp(120px,8vw,220px)';
  const margin = typeof marginPx === 'number' ? `${marginPx}px` : 'clamp(12px,2.4vw,28px)';

  const corner = (p) =>
    p === 'tl' ? 'top-0 left-0' : p === 'tr' ? 'top-0 right-0' : p === 'bl' ? 'bottom-0 left-0' : 'bottom-0 right-0';

  return (
    <>
      {/* Enforced 3ROTIX watermark */}
      <Watermark3rotix position={position} width={width} opacity={opacity} margin={margin} />

      {/* Optional creator logo */}
      {logoUrl ? (
        <div className={`absolute ${corner(logoPosition)} pointer-events-none`} style={{ padding: margin }}>
          <img src={logoUrl} alt="" width={logoSize} height={logoSize} draggable={false}
               style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' }} />
        </div>
      ) : null}

      {/* Optional lower-third */}
      {lowerText ? (
        <div className={`absolute ${corner(lowerPos)} w-full pointer-events-none`} style={{ padding: margin }}>
          <div className="inline-block rounded-xl px-3 py-1.5 text-sm font-medium"
               style={{ color: lowerColor, background: lowerBg, backdropFilter: 'blur(6px)' }}>
            {lowerText}
          </div>
        </div>
      ) : null}
    </>
  );
}
