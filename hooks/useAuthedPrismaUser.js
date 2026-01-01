// /hooks/useAuthedPrismaUser.js
import { getSupabaseClient } from "../utils/supabase/client";
import { useEffect, useState } from "react";

export function useAuthedPrismaUser() {
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [prismaUser, setPrismaUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;

    async function load() {
      try {
        if (typeof window === "undefined") return;

        const supabase = getSupabaseClient(); // ✅ your client
        if (!supabase) throw new Error("Supabase client not created");

        // 1️⃣ Get current user
        const { data, error: getErr } = await supabase.auth.getUser();
        if (getErr) throw getErr;
        const u = data?.user || null;
        if (!mounted) return;

        setSupabaseUser(u);

        // 2️⃣ Ensure public.User exists
        if (u?.email) {
          const ensure = await fetch("/api/user/ensure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: u.email,
              name: u.user_metadata?.name || null,
              image: u.user_metadata?.avatar_url || null,
            }),
          }).then((r) => r.json());

          if (ensure?.error) throw new Error(ensure.error);
          setPrismaUser(ensure.user || null);
        } else {
          setPrismaUser(null);
        }

        // 3️⃣ Watch for login/logout
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session?.user) {
            setSupabaseUser(null);
            setPrismaUser(null);
          } else {
            setSupabaseUser(session.user);
            // Optionally, re-fetch prismaUser here if needed
   }
        });

        unsubscribe = sub?.subscription?.unsubscribe?.bind(sub.subscription) ?? null;
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      try {
        unsubscribe && unsubscribe();
      } catch {}
    };
  }, []);

  return { loading, error, supabaseUser, prismaUser };
}
