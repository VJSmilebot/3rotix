// pages/api/livepeer/asset/[id].js
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing-id' });

  try {
    const r = await fetch(`https://livepeer.studio/api/asset/${id}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json(j);

    // Old vs new shapes
    const phase = j?.status?.phase || j?.status; // 'ready' when done
    const playbackId = j?.playbackId || j?.asset?.playbackId || j?.playback?.id || null;

    return res.status(200).json({ status: phase, playbackId, asset: j });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
