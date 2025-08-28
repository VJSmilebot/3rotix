import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';


let browserClient;
export function getSupabaseClient() {
if (!browserClient) {
browserClient = createPagesBrowserClient();
}
return browserClient;
}