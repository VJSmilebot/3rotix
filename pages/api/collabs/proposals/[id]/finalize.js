import { prisma } from "../../../../../lib/prisma";
import { withAuth } from "../../../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ ok: false, error: "id_required" });

  const me = req.user;

  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.collabProposal.findUnique({
        where: { id },
        select: {
          id: true,
          createdById: true,
          recipientId: true,
          status: true,
          terms: { select: { isRequired: true, status: true } },
          workspace: { select: { id: true } },
        },
      });

      if (!p) throw new Error("NOT_FOUND");
      if (p.createdById !== me.id && p.recipientId !== me.id) throw new Error("FORBIDDEN");
      if (p.status === "DECLINED" || p.status === "CANCELED") throw new Error("proposal_closed");

      const openRequired = p.terms.filter((t) => t.isRequired && t.status !== "ACCEPTED");
      if (openRequired.length > 0) throw new Error("terms_not_accepted");

      await tx.collabProposal.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      if (p.workspace?.id) {
        await tx.collabWorkspace.update({
          where: { id: p.workspace.id },
          data: { status: "COMPLETE" },
        });
      }

      const full = await tx.collabProposal.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, handle: true } },
          recipient: { select: { id: true, handle: true } },
          terms: { include: { activeVersion: true }, orderBy: { createdAt: "asc" } },
          workspace: { include: { files: true } },
        },
      });

      await tx.collabAgreementSnapshot.create({
        data: {
          proposalId: id,
          workspaceId: full?.workspace?.id || null,
          snapshotJson: full || {},
        },
      });
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err?.message || "SERVER_ERROR";
    if (msg === "NOT_FOUND") return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    if (msg === "FORBIDDEN") return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    if (msg === "terms_not_accepted") return res.status(400).json({ ok: false, error: "terms_not_accepted" });
    if (msg === "proposal_closed") return res.status(400).json({ ok: false, error: "proposal_closed" });

    console.error("collabs finalize error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: msg });
  }
});
