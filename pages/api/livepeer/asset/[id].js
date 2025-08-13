// pages/api/livepeer/asset/[id].js
// GET -> { status, playbackId?, asset? }
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const lpRes = await fetch(`https://livepeer.studio/api/asset/${id}`, {
      headers: { Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}` },
    });
    const json = await lpRes.json();
    if (!lpRes.ok) return res.status(lpRes.status).json(json);

    // ready when json.status?.phase === 'ready' (new API) or json.status === 'ready' (older)
    const phase = json?.status?.phase || json?.status;
    const playbackId = json?.playbackId || json?.asset?.playbackId;
    res.status(200).json({ status: phase, playbackId, asset: json });
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
