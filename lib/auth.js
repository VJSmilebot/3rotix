import { createSupabaseServerClient } from "../utils/supabase/server.js";
import { prisma } from "./prisma.js";

export async function getSupabaseUser(req, res) {
  try {
    const supabase = createSupabaseServerClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { email: user.email ?? "" }] },
      select: { id: true, email: true, role: true },
    });
    return dbUser || null;
  } catch {
    return null;
  }
}

export const getUserFromAuthHeader = getSupabaseUser;
export const getSessionUser = getSupabaseUser;
