import { getSupabaseUser } from "../../../lib/auth.js";
import { assertAdmin, audit } from "../../../lib/admin.js";
import { prisma } from "../../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const admin = await getSupabaseUser(req);
  try {
    assertAdmin(req, admin);
    const { ownerEmailOrHandle, title, type, status, storageUrl, livepeerStreamId, livepeerPlaybackId, thumbnailUrl } = req.body || {};

    const owner = await prisma.user.findFirst({ where: { OR: [{ email: ownerEmailOrHandle }, { handle: ownerEmailOrHandle }] }, select: { id: true } });
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    const content = await prisma.content.create({
      data: {
        creatorId: owner.id,
        title: title || "Untitled",
        type, status,
        storageUrl: storageUrl || null,
        livepeerStreamId: livepeerStreamId || null,
        livepeerPlaybackId: livepeerPlaybackId || null,
        thumbnailUrl: thumbnailUrl || null,
      },
    });

    await audit(admin?.id || null, "ADMIN_CONTENT_CREATE", content.id, { owner: owner.id, type, status });
    res.json({ ok: true, content });
  } catch (e) {
    res.status(403).json({ error: String(e.message || e) });
  }
}
