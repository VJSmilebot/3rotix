// GET /api/livepeer/playback/:id  →  { hlsUrl: "https://.../index.m3u8" }
export default async function handler(req, res) {
  const { id } = req.query; // playbackId
  if (!id) return res.status(400).json({ error: 'missing-playbackId' });

  const API_KEY = process.env.LIVEPEER_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'missing-livepeer-api-key' });

  try {
    // Ask Livepeer for playback info
    const infoResp = await fetch(`https://livepeer.studio/api/playback/${id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store',
      redirect: 'follow',
    });
    const infoJson = await infoResp.json().catch(() => ({}));
    if (!infoResp.ok) {
      return res.status(infoResp.status).json({ error: 'livepeer-error', body: infoJson });
    }

    // Extract HLS URL in a shape-tolerant way
    let hls =
      infoJson?.source?.hls ||
      infoJson?.source?.[0]?.hls ||
      infoJson?.meta?.playbackUrls?.hls ||
      `https://livepeercdn.studio/hls/${id}/index.m3u8`;

    // Resolve redirects server-side for a single stable URL
    let finalUrl = hls;
    try {
      const follow = await fetch(hls, { method: 'GET', redirect: 'follow', cache: 'no-store' });
      if (follow.ok && follow.url) finalUrl = follow.url;
    } catch { /* keep original hls */ }

    return res.status(200).json({ hlsUrl: finalUrl, meta: infoJson?.meta || null });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
