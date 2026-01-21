import { prisma } from "../../../../../lib/prisma";
import { withAuth } from "../../../../../lib/auth-middleware";

function asValueJson(input) {
  if (input && typeof input === "object") return input;
  return { text: String(input ?? "") };
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const termId = String(req.query.termId || "");
  const { valueJson } = req.body || {};
  if (!termId) return res.status(400).json({ ok: false, error: "termId_required" });

  const me = req.user;

  try {
    const term = await prisma.collabTerm.findUnique({
      where: { id: termId },
      select: {
        id: true,
        proposalId: true,
        proposal: { select: { id: true, createdById: true, recipientId: true, status: true } },
      },
    });

    if (!term) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const p = term.proposal;
    if (p.createdById !== me.id && p.recipientId !== me.id) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    const v = await prisma.collabTermVersion.create({
      data: {
        termId,
        createdById: me.id,
        valueJson: asValueJson(valueJson),
      },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.collabTerm.update({
        where: { id: termId },
        data: {
          status: "COUNTERED",
          activeVersionId: v.id,
        },
      });

      if (p.status === "SENT" || p.status === "DRAFT") {
        await tx.collabProposal.update({
          where: { id: p.id },
          data: { status: "NEGOTIATING" },
        });
      }
    });

    return res.status(200).json({ ok: true, versionId: v.id });
  } catch (err) {
    console.error("term counter error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err?.message });
  }
});
