// pages/api/livepeer/create-stream.js - NO AUTH CHECKS VERSION

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Use a fixed ID for anonymous streams
  const uid = 'anonymous-user';

  // Create stream on Livepeer
  try {
    const { name, record = true } = (req.body || {});
    
    // Remove the problematic meta field from request
    const resp = await fetch('https://livepeer.studio/api/stream', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || `stream_${uid}_${Date.now()}`,
        record,
        profiles: [
          { name: '720p', bitrate: 2000000, fps: 30, width: 1280, height: 720 }, 
          { name: '480p', bitrate: 1000000, fps: 30, width: 854, height: 480 },
        ]
        // Removed meta: { nsfw } field that was causing the error
      }),
    });

    const data = await resp.json();
    console.log('Livepeer API response:', data); // Add this for debugging
    
    if (!resp.ok) {
      console.error('Livepeer error:', data);
      return res.status(resp.status).json({ error: data?.errors?.[0]?.message || 'Livepeer error' });
    }

    // Normalize the fields our UI expects - be more defensive about extracting the URLs
    const out = {
      id: data?.id,
      playbackId: data?.playbackId,
      webrtcIngestUrl: data?.ingest?.webrtc || data?.webrtc?.ingest || data?.ingest?.['webRTC'] || data?.webrtcIngest?.url || '',
      rtmpIngestUrl: data?.ingest?.rtmp || data?.rtmp?.ingest?.url || data?.ingest?.['rtmp'] || '',
      streamKey: data?.streamKey || data?.rtmp?.ingest?.streamKey || '',
      name: data?.name,
    };

    // Log if webrtcIngestUrl is missing
    if (!out.webrtcIngestUrl) {
      console.warn('Warning: webrtcIngestUrl is missing from Livepeer response:', data);
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error('Stream creation error:', err);
    return res.status(500).json({ error: 'Failed to create stream: ' + (err.message || 'Unknown error') });
  }
}
