// pages/api/livepeer/fetch-streams.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Processing Livepeer stream fetch for user:', userId);

    // Fetch streams from Livepeer Studio API
    const response = await fetch('https://livepeer.studio/api/stream', {
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Livepeer API error: ${response.status}`);
      return res.status(response.status).json({
        error: `Livepeer API error: ${response.status}`,
      });
    }

    const livepeerStreams = await response.json();
    console.log(`Retrieved ${livepeerStreams.length} streams from Livepeer`);

    // TODO: if you tag streams per user, filter here.
    // For now we just return everything.
    const userStreams = livepeerStreams;

    return res.status(200).json({
      success: true,
      streams: userStreams,
      total: userStreams.length,
    });
  } catch (error) {
    console.error('Error in fetch-streams API:', error);
    return res.status(500).json({ error: error.message });
  }
}
