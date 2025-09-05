// IMPORTANT: Re-export the SSR client to maintain compatibility
import { getSupabaseClient } from '../utils/supabase/client';

// Re-export the SSR client
export const supabase = getSupabaseClient();