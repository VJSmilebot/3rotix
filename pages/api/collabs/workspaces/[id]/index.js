// pages/api/collabs/workspaces/[id]/index.js
import { prisma } from "../../../../../lib/prisma.js";
import { withAuth } from "../../../../../lib/auth-middleware.js";

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const id = req.query.id?.toString();
  if (!id) return res.status(400).json({ ok: false, error: "id_required" });

  const userId = req.user.id;

  try {
    const rows = await prisma.$queryRaw`
      SELECT w.*, p."senderId", p."recipientId", p."id" as "proposalId", p."title"
      FROM public."CollabWorkspace" w
      JOIN public."CollabProposal" p ON p."id" = w."proposalId"
      WHERE w."id" = ${id}
      LIMIT 1
    `;
    const ws = rows?.[0];
    if (!ws) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const isParticipant = ws.senderId === userId || ws.recipientId === userId;
    if (!isParticipant) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    const files = await prisma.$queryRaw`
      SELECT *
      FROM public."CollabFile"
      WHERE "workspaceId" = ${id}
      ORDER BY "createdAt" DESC NULLS LAST
    `;

    return res.status(200).json({ ok: true, workspace: ws, files: files || [] });
  } catch (err) {
    console.error("workspace get error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});
