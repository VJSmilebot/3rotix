// components/LivepeerPlayer.js
import React from 'react';

export default function LivepeerPlayer({ playbackId, autoplay = true }) {
  if (!playbackId) {
    return <div style={{ color: 'tomato', padding: 12 }}>Missing playbackId</div>;
  }

  // Livepeer iframe player (works great for PUBLIC assets)
  const src = `https://lvpr.tv?v=${encodeURIComponent(playbackId)}${
    autoplay ? '&autoplay=true&muted=true' : ''
  }`;

  return (
    <div className="lp-wrap">
      <div className="lp-container">
        <iframe
          src={src}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          frameBorder="0"
          allowFullScreen
          title={`Video ${playbackId}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 14,
            background: '#0b0b0f',
          }}
        />
      </div>

      <style jsx>{`
        .lp-wrap {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #0b0b0f;
          border-radius: 14px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
