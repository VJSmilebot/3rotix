// /components/EnsurePrismaUserOnMount.jsx
import { useEffect } from "react";
import { getSupabaseClient } from "../utils/supabase/client"; // <- your existing client

export default function EnsurePrismaUserOnMount() {
  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const supabase = getSupabaseClient();

        // Read the current user from Supabase
        const { data } = await supabase.auth.getUser();
        const u = data?.user;
        if (!mounted || !u?.email) return;

        // Avoid repeating during this browser session
        const key = `ensured:${u.id}`;
        if (sessionStorage.getItem(key)) return;

        // Create/update public.User row and get Prisma id back
        const resp = await fetch("/api/user/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            name: u.user_metadata?.name || null,
            image: u.user_metadata?.avatar_url || null,
          }),
        }).then((r) => r.json());

        if (resp?.user?.id) {
          // Optional convenience: stash Prisma id for client-side use
          sessionStorage.setItem("prismaUserId", resp.user.id);
          sessionStorage.setItem(key, "1");
        }
      } catch {
        // fail silently in prod; dashboard will still handle errors gracefully
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
