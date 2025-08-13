import { getSupabaseClient } from '../../../utils/supabase/client';
import { signAccessJwt } from '@livepeer/core/crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) return res.status(401).json({ error: 'Unauthorized' });

  const { playbackId } = req.body;
  if (!playbackId) return res.status(400).json({ error: 'Missing playbackId' });

  const token = await signAccessJwt({
    privateKey: process.env.ACCESS_CONTROL_PRIVATE_KEY,
    publicKey: process.env.NEXT_PUBLIC_ACCESS_CONTROL_PUBLIC_KEY,
    issuer: '3rotix',
    playbackId,
    expiration: '1h',
    custom: { uid: data.user.id },
  });

  res.status(200).json({ token });
}
