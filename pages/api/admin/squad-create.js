import { withAuth } from "../../../lib/auth-middleware.js";
import { prisma } from "../../../lib/prisma.js";

export default withAuth(
  async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    try {
      const { ownerEmailOrHandle, name, slug } = req.body || {};

      const owner = await prisma.user.findFirst({
        where: {
          OR: [{ email: ownerEmailOrHandle }, { handle: ownerEmailOrHandle }],
        },
        select: { id: true },
      });
      if (!owner) return res.status(404).json({ error: "Owner not found" });

      const squad = await prisma.squad.create({
        data: { name, slug, ownerId: owner.id },
      });

      await prisma.squadMember.create({
        data: { squadId: squad.id, userId: owner.id, role: "OWNER" },
      });

      return res.json({ ok: true, squad });
    } catch (e) {
      const status = e.status || e.statusCode || 500;
      return res.status(status).json({ ok: false, error: e.message || String(e) });
    }
  },
  { roles: ["ADMIN"] } // 👈 this replaces requireAdmin
);
