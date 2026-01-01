import { getSupabaseUser } from "../../../lib/auth.js";
import { assertAdmin, audit } from "../../../lib/admin.js";
import { prisma } from "../../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = await getSupabaseUser(req);
  try {
    assertAdmin(req, admin);
    const { ownerEmailOrHandle, name, slug } = req.body || {};

    const owner = await prisma.user.findFirst({ where: { OR: [{ email: ownerEmailOrHandle }, { handle: ownerEmailOrHandle }] }, select: { id: true } });
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    const squad = await prisma.squad.create({ data: { name, slug, ownerId: owner.id } });
    await prisma.squadMember.create({ data: { squadId: squad.id, userId: owner.id, role: "OWNER" } });

    await audit(admin?.id || null, "ADMIN_SQUAD_CREATE", squad.id, { owner: owner.id, slug });
    res.json({ ok: true, squad });
  } catch (e) {
    res.status(403).json({ error: String(e.message || e) });
  }
}
