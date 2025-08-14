// pages/api/livepeer/request-upload.js
// POST { name, playbackPolicy } -> { assetId, tusUrl }
import { getEnvVar } from '../../../utils/env';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_KEY = getEnvVar('LIVEPEER_API_KEY');
  
    if (!API_KEY) {
      console.error('Missing LIVEPEER_API_KEY environment variable');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { name, playbackPolicy = 'public' } = req.body || {};
    
    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid or missing name parameter' });
    }

    if (name.length > 255) {
      return res.status(400).json({ error: 'Name too long (max 255 characters)' });
    }

    // Validate playback policy
    const validPolicies = ['public', 'jwt'];
    const normalizedPolicy = typeof playbackPolicy === 'string' ? playbackPolicy : playbackPolicy?.type;
    if (!validPolicies.includes(normalizedPolicy)) {
      return res.status(400).json({ error: 'Invalid playback policy. Must be "public" or "jwt"' });
    }

    const policy = normalizedPolicy === 'jwt' ? { type: 'jwt' } : { type: 'public' };

    const lpRes = await fetch('https://livepeer.studio/api/asset/request-upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.trim(), playbackPolicy: policy }),
    });

    const text = await lpRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Livepeer response:', parseError);
      json = null;
    }

    if (!lpRes.ok) {
      console.error('Livepeer API error:', {
        status: lpRes.status,
        response: text?.slice(0, 500),
      });
      return res.status(lpRes.status).json({
        error: 'External service error',
        status: lpRes.status,
        details: process.env.NODE_ENV === 'development' ? text?.slice(0, 800) : undefined,
      });
    }

    // Extract asset ID and TUS URL from response
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
      console.error('Unexpected Livepeer response structure:', {
        hasAssetId: !!assetId,
        hasTusUrl: !!tusUrl,
        responseKeys: json ? Object.keys(json) : 'null',
      });
      return res.status(502).json({
        error: 'Unexpected external service response',
        hint: 'Missing required response fields',
        debug: process.env.NODE_ENV === 'development' ? (json || text?.slice(0, 800)) : undefined,
      });
    }

    return res.status(200).json({ assetId, tusUrl });
  } catch (error) {
    console.error('Request upload error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
