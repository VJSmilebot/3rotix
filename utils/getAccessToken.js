// utils/getAccessToken.js
import { getSupabaseClient } from "./supabase/client";

export async function getAccessToken() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}
