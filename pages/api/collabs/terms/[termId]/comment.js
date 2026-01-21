// pages/api/collabs/terms/[termId]/comment.js
import { prisma } from "../../../../../lib/prisma";
import { withAuth } from "../../../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const termId = String(req.query.termId || "");
  const { body } = req.body || {};

  if (!termId) return res.status(400).json({ ok: false, error: "termId_required" });
  if (!body || typeof body !== "string") return res.status(400).json({ ok: false, error: "body_required" });

  const me = req.user;

  try {
    const term = await prisma.collabTerm.findUnique({
      where: { id: termId },
      select: {
        id: true,
        proposal: { select: { createdById: true, recipientId: true } },
      },
    });

    if (!term) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const p = term.proposal;
    if (p.createdById !== me.id && p.recipientId !== me.id) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    const c = await prisma.collabTermComment.create({
      data: {
        termId,
        authorId: me.id,
        body: body.slice(0, 5000),
      },
      select: { id: true },
    });

    return res.status(200).json({ ok: true, id: c.id });
  } catch (err) {
    console.error("term comment error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err?.message });
  }
});
