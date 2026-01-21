import { prisma } from "../../../../lib/prisma";
import { withAuth } from "../../../../lib/auth-middleware";

const ALLOWED = new Set(["RAW", "PREVIEW", "FINAL", "CONTRACT", "OTHER"]);

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const me = req.user;
  const { workspaceId, storagePath, filename, size, mime, category } = req.body || {};

  if (!workspaceId || !storagePath || !filename) {
    return res.status(400).json({ ok: false, error: "workspaceId_storagePath_filename_required" });
  }

  const cat = ALLOWED.has(String(category || "")) ? String(category) : "RAW";

  try {
    const ws = await prisma.collabWorkspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, proposal: { select: { createdById: true, recipientId: true } } },
    });

    if (!ws) return res.status(404).json({ ok: false, error: "workspace_not_found" });

    const p = ws.proposal;
    if (p.createdById !== me.id && p.recipientId !== me.id) return res.status(403).json({ ok: false, error: "FORBIDDEN" });

    const row = await prisma.collabFile.create({
      data: {
        workspaceId,
        storagePath,
        filename,
        size: typeof size === "number" ? size : null,
        mime: mime || null,
        category: cat,
        uploadedById: me.id,
      },
      select: { id: true },
    });

    return res.status(200).json({ ok: true, id: row.id });
  } catch (err) {
    console.error("file register error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err?.message });
  }
});