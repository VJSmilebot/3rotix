import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VideosGrid({ userId }) {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        // ✅ ONLY use Prisma API - NO SUPABASE
        const res = await fetch(`/api/videos?userId=${userId}&visibility=public`);
        
        if (cancelled) return;
        
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to load videos');
        } else {
          const data = await res.json();
          setVideos(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (error) return <div style={{ color: 'tomato', marginTop: 12 }}>{error}</div>;

  return (
    <div className="wrap">
      <h2 className="sectionTitle">Videos</h2>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="empty">No public videos yet.</div>
      ) : (
        <div className="grid">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors"
            >
              {video.playbackId ? (
                <div className="relative pb-[56.25%] bg-black">
                  <iframe
                    src={`https://lvpr.tv?v=${video.playbackId}&autoplay=false&muted=false`}
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <div className="relative pb-[56.25%] bg-gray-800 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Processing...</span>
                </div>
              )}
              
              <div className="p-3">
                <h3 className="text-sm font-medium line-clamp-2 mb-1">
                  {video.title || 'Untitled video'}
                </h3>
                {video.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .wrap { margin-top: 24px; }
        .sectionTitle {
          font-size: 1.25rem;
          margin: 0 0 12px 0;
          color: #fff;
        }
        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .card {
          background: #0b0b0f;
          border: 1px solid rgba(255,255,255,0.08);
          borderRadius: 14px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
        }
        .card:hover {
          transform: translateY(-2px);
          border-color: rgba(219, 39, 119, 0.3);
        }

        .skeleton {
          height: 220px;
          background: linear-gradient(90deg, #12121a 25%, #171724 37%, #12121a 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: -135% 0%; }
        }

        .frame {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          overflow: hidden;
        }
        .frame iframe {
          position: absolute; 
          inset: 0;
          width: 100%; 
          height: 100%;
          border: 0;
        }
        .meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .title {
          color: #fff;
          font-size: 14px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          max-width: 70%;
        }
        .watch {
          color: #ff2fb9;
          text-decoration: none;
          font-size: 14px;
        }
        .watch:hover { text-decoration: underline; }
        .empty { color: #aaa; padding: 6px 2px; }
      `}</style>
    </div>
  );
}