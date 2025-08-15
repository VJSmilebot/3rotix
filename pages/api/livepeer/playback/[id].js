// pages/api/livepeer/playback/[id].js
export default async function handler(req, res) {
  const { id } = req.query; // playbackId
  if (!id) return res.status(400).json({ error: 'missing-playbackId' });

  try {
    const r = await fetch(`https://livepeer.studio/api/playback/${id}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
      cache: 'no-store',
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json(j);

    // Livepeer returns sources with type + url(s). We’ll pick HLS master manifest.
    // Shapes vary; handle a few.
    let hlsUrl =
      j?.source?.hls ||                                  // some shapes
      j?.source?.[0]?.hls ||                             // array shape
      j?.meta?.playbackUrls?.hls ||                      // future shape
      null;

    // Fallback: construct common livepeercdn URL if not present
    if (!hlsUrl) hlsUrl = `https://livepeercdn.studio/hls/${id}/index.m3u8`;

    return res.status(200).json({ hlsUrl, raw: j });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
