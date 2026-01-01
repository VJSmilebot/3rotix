// pages/api/livepeer/asset/[id].js
export default async function handler(req, res) {
  const { assetId } = req.query;
  if (!assetId) return res.status(400).json({ error: 'missing-assetId' });

  try {
    const r = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
    });
    const j = await r.json();
    if (!r.ok) {
      console.error('[Livepeer Asset] Error:', r.status, j);
      return res.status(r.status).json(j);
    }

    // Old vs new shapes
    const phase = j?.status?.phase || j?.status; // 'ready' when done
    const playbackId = j?.playbackId || j?.asset?.playbackId || j?.playback?.id || null;

    console.log(`[Asset ${assetId}] Status: ${phase}, PlaybackId: ${playbackId}`);
    return res.status(200).json({ status: phase, playbackId, asset: j });
  } catch (e) {
    console.error('[Livepeer Asset] Exception:', e);
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
