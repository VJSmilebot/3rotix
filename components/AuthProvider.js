import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import AuthContext from "../context/AuthContext";
import { getSupabaseClient } from "../utils/supabase/client";

export default function AuthProvider({ children }) {
  const router = useRouter();

  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // IMPORTANT: browser-only creation
    const sb = getSupabaseClient();
    setSupabase(sb);

    let alive = true;

    (async () => {
      const { data, error } = await sb.auth.getSession();
      if (!alive) return;

      if (error) {
        console.warn("AuthProvider.getSession error:", error.message);
      }

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setReady(true);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (!supabase) return;
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      console.error("signOut failed:", e);
    }
  }, [supabase, router]);

  const accessToken = session?.access_token ?? null;

  const value = useMemo(
    () => ({
      supabase,
      session,
      user,
      accessToken,
      ready,
      isAuthed: !!user,
      signOut,
    }),
    [supabase, session, user, accessToken, ready, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
  