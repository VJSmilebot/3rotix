import { getSupabaseClient } from './supabase/client';

const supabase = getSupabaseClient();

export async function uploadMessageMedia(file, userId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('messages')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      type: file.type,
      name: file.name,
      size: file.size,
    };
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
}

export async function uploadVoiceNote(audioBlob, userId) {
  try {
    const fileName = `${userId}/voice-${Date.now()}.webm`;
    
    const { data, error } = await supabase.storage
      .from('messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('Voice upload error:', err);
    throw err;
  }
}

export function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}