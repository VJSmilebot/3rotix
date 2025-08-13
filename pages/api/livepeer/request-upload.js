// pages/api/livepeer/request-upload.js
// POST { name, playbackPolicy } -> { assetId, tusUrl }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, playbackPolicy = 'public' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const lpRes = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        playbackPolicy: playbackPolicy === 'jwt' ? { type: 'jwt' } : { type: 'public' },
      }),
    });

    if (!lpRes.ok) {
      const text = await lpRes.text();
      return res.status(lpRes.status).json({ error: 'Livepeer error', detail: text });
    }

    const json = await lpRes.json();
    // json has: asset.id and tusEndpoint; sometimes nested under 'asset'/'task'
    const assetId = json?.asset?.id || json?.asset?.assetId || json?.id;
    const tusUrl  = json?.tusEndpoint || json?.tus?.url;

    if (!assetId || !tusUrl) {
      return res.status(500).json({ error: 'Unexpected Livepeer response', json });
    }

    res.status(200).json({ assetId, tusUrl });
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
