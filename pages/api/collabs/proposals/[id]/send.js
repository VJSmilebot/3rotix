// pages/api/collabs/proposals/[id]/send.js
import { prisma } from "../../../../../lib/prisma";
import { withAuth } from "../../../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ ok: false, error: "id_required" });

  const me = req.user;

  try {
    const proposal = await prisma.collabProposal.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });

    if (!proposal) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    if (proposal.createdById !== me.id) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    // If your enum doesn't have SENT, change it to whatever you use.
    if (proposal.status !== "DRAFT") return res.status(400).json({ ok: false, error: "not_draft" });

    await prisma.collabProposal.update({
      where: { id },
      data: { status: "SENT" },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("collabs send error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err?.message });
  }
});
