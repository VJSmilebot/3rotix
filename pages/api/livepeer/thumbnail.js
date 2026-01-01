export default async function handler(req, res) {
  const { assetId } = req.query;
  
  if (!assetId) {
    return res.status(400).json({ error: 'assetId required' });
  }

  try {
    // Fetch asset details from Livepeer
    const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = await response.json();
    
    // Return thumbnail URL if available
    const thumbnailUrl = asset?.storage?.ipfs?.nftMetadata?.image || 
                        `https://livepeer.studio/api/asset/${assetId}/thumbnail`;
    
    return res.status(200).json({ thumbnailUrl });
  } catch (error) {
    console.error('Thumbnail fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch thumbnail' });
  }
}