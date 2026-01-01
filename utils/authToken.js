// utils/authToken.js
import { getSupabaseClient } from "../utils/supabase/client";

export async function getAccessToken() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
