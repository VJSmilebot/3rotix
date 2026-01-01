import { createSupabaseServerClient } from "./supabase/server";

export function requireAuth(handler) {
  return async (req, res) => {
    try {
      const supabase = createSupabaseServerClient(req, res);

      // 1) try Authorization header first
      const authHeader = req.headers.authorization || "";
      let token = authHeader.replace("Bearer ", "").trim();

      // 2) fallback: try supabase session from cookies
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || "";
      }

      if (!token) {
        return res.status(401).json({ error: "Unauthorized - No token provided" });
      }

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ error: "Unauthorized - Invalid token" });
      }

      req.user = data.user;
      return handler(req, res);
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}
