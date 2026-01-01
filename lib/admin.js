import { prisma } from "./prisma.js";

export function assertAdmin(req, user) {
  if (!user || user.role !== "MOD") throw new Error("Forbidden");
  const hdr = (req.headers["x-admin-token"] || "").toString();
  if (!process.env.ADMIN_PANEL_TOKEN || hdr !== process.env.ADMIN_PANEL_TOKEN) throw new Error("Forbidden");
}

export async function audit(actorId, action, target, details) {
  try {
    await prisma.auditLog.create({ data: { actorId: actorId || null, action, target: target || null, details: details || null } });
  } catch { /* optional table */ }
}
