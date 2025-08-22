import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '../utils/supabase/client';
const supabase = getSupabaseClient();

export default function VideosGrid({ userId }) {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('videos')
        .select('id, playback_id, title, created_at, visibility')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) setError(error.message);
      else setVideos(data || []);
      setLoading(false);
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
          {videos.map(v => (
            <article className="card" key={v.id}>
              <div className="frame">
                <iframe
                  src={`https://lvpr.tv?v=${encodeURIComponent(v.playback_id)}&muted=true`}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                  title={v.title || v.playback_id}
                />
              </div>
              <div className="meta">
                <div className="title" title={v.title || ''}>
                  {v.title || 'Untitled'}
                </div>
                <Link className="watch" href={`/watch/${v.playback_id}`}>
                  Watch →
                </Link>
              </div>
            </article>
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
          grid-template-columns: repeat(12, 1fr);
        }
        @media (max-width: 1280px) { .grid { grid-template-columns: repeat(12, 1fr); } }
        @media (max-width: 1024px) { .grid { grid-template-columns: repeat(8, 1fr); } }
        @media (max-width: 768px)  { .grid { grid-template-columns: repeat(6, 1fr); } }
        @media (max-width: 560px)  { .grid { grid-template-columns: repeat(4, 1fr); } }

        .card {
          grid-column: span 4;     /* 3 across on desktop */
          background: #0b0b0f;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
        }
        @media (max-width: 1024px) { .card { grid-column: span 4; } } /* 2–3 across */
        @media (max-width: 768px)  { .card { grid-column: span 6; } } /* 2 across */
        @media (max-width: 560px)  { .card { grid-column: span 4; } } /* 1 across */

        .skeleton {
          height: 220px;
          background: linear-gradient(90deg, #12121a 25%, #171724 37%, #12121a 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
          border-radius: 14px;
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
        }
        .frame iframe {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
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