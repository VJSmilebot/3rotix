// pages/api/livepeer/request-upload.js
// POST { name, playbackPolicy } -> { assetId, tusUrl }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });

  const API_KEY = process.env.LIVEPEER_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'missing-livepeer-api-key' });

  const { name, playbackPolicy = 'public' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'missing-name' });

  const policy =
    playbackPolicy === 'jwt' || playbackPolicy?.type === 'jwt'
      ? { type: 'jwt' }
      : { type: 'public' };

  try {
    const lpRes = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, playbackPolicy: policy }),
    });

    const text = await lpRes.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }

    if (!lpRes.ok) {
      return res.status(lpRes.status).json({
        error: 'livepeer-error',
        status: lpRes.status,
        body: (text || '').slice(0, 800),
      });
    }

    // Be permissive about shapes
    const assetId =
      json?.asset?.id ||
      json?.asset?.assetId ||
      json?.id ||
      json?.task?.outputAssetId ||
      null;

    const tusUrl =
      json?.tusEndpoint ||
      json?.tus?.url ||
      json?.upload?.tusEndpoint ||
      json?.url ||
      null;

    if (!assetId || !tusUrl) {
      return res.status(502).json({
        error: 'unexpected-livepeer-response',
        hint: 'No assetId/tusUrl in response',
        json: json || text?.slice(0, 800),
      });
    }

    return res.status(200).json({ assetId, tusUrl });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e) });
  }
}
