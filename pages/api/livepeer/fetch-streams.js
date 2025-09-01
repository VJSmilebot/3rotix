import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get userId from request body
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log("Processing request for user:", userId);
    
    // Fetch streams from Livepeer API
    const response = await fetch('https://livepeer.studio/api/stream', {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`Livepeer API error: ${response.status}`);
      return res.status(response.status).json({ 
        error: `Livepeer API error: ${response.status}` 
      });
    }
    
    const livepeerStreams = await response.json();
    console.log(`Retrieved ${livepeerStreams.length} streams from Livepeer`);
    
    // Filter for this user's streams (by a field that identifies the user in Livepeer)
    // Note: You might need to change how you identify streams belonging to this user
    const userStreams = livepeerStreams.filter(stream => {
      // This filtering logic depends on how Livepeer associates streams with users
      // It could be stream.userId, stream.name, or some other property
      return true; // For now, include all streams
    });
    
    console.log(`Found ${userStreams.length} streams potentially for user ${userId}`);
    
    let streamsAdded = 0;
    
    // For each stream, check if it exists in your database
    for (const stream of userStreams) {
      // Check if stream exists in database
      const { data: existingStream } = await supabase
        .from('streams')
        .select('id')
        .eq('stream_id', stream.id)
        .maybeSingle();
        
      if (existingStream) {
        // Update existing stream status
        await supabase
          .from('streams')
          .update({
            status: stream.isActive ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('stream_id', stream.id);
      } else {
        // Add new stream to database
        await supabase
          .from('streams')
          .insert({
            user_id: userId,
            stream_id: stream.id,
            stream_key: stream.streamKey,
            playback_id: stream.playbackId,
            name: stream.name || 'Untitled Stream',
            status: stream.isActive ? 'active' : 'inactive',
            record: stream.record || false,
            created_at: new Date(stream.createdAt || Date.now()).toISOString(),
            updated_at: new Date().toISOString()
          });
          
        streamsAdded++;
      }
    }
    
    return res.status(200).json({
      success: true,
      streamsAdded,
      streamsUpdated: userStreams.length - streamsAdded
    });
  } catch (error) {
    console.error('Error in fetch-streams API:', error);
    return res.status(500).json({ error: error.message });
  }
}