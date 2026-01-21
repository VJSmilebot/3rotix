// pages/api/collabs/proposals/[id]/index.js
import { prisma } from "../../../../../lib/prisma";
import { withAuth } from "../../../../../lib/auth-middleware";

function isParticipant(p, userId) {
  return p.createdById === userId || p.recipientId === userId;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ ok: false, error: "id_required" });

  const me = req.user;

  try {
    const proposal = await prisma.collabProposal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, handle: true } },
        recipient: { select: { id: true, handle: true } },
        workspace: {
          select: {
            id: true,
            status: true,
            files: {
              orderBy: { createdAt: "desc" },
              take: 200,
              select: {
                id: true,
                storagePath: true,
                filename: true,
                size: true,
                mime: true,
                category: true,
                uploadedBy: { select: { id: true, handle: true } },
                createdAt: true,
              },
            },
          },
        },
        terms: {
          orderBy: { createdAt: "asc" },
          include: {
            activeVersion: { select: { id: true, valueJson: true, createdById: true, createdAt: true } },
            comments: {
              orderBy: { createdAt: "asc" },
              take: 200,
              include: { author: { select: { id: true, handle: true } } },
            },
          },
        },
      },
    });

    if (!proposal) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    if (!isParticipant(proposal, me.id)) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    return res.status(200).json({ ok: true, proposal });
  } catch (err) {
    console.error("collabs proposal get error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});
