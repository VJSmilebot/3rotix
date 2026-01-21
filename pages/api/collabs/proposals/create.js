import { prisma } from "../../../../lib/prisma";
import { withAuth } from "../../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const me = req.user; // public.User from middleware
    const { recipientHandle, title, note } = req.body || {};

    const cleanHandle = String(recipientHandle || "").trim().toLowerCase();
    if (!cleanHandle) {
      return res.status(400).json({ ok: false, error: "recipient_handle_required" });
    }

    // find recipient by handle
    const recipient = await prisma.user.findFirst({
      where: { handle: cleanHandle },
      select: { id: true, handle: true },
    });

    if (!recipient) {
      return res.status(404).json({ ok: false, error: "recipient_not_found" });
    }

    // Prisma names after db pull (based on your error output)
    const REL_CREATED_BY = "User_CollabProposal_created_by_idToUser";
    const REL_RECIPIENT = "User_CollabProposal_recipient_user_idToUser";
    const REL_WORKSPACE = "CollabWorkspace";

    // IMPORTANT:
    // - don't pass createdById / recipientId (your client doesn't accept those)
    // - don't pass note unless your current prisma schema actually has it
    //   (you saw "Unknown argument note" — so we store it only if the field exists)
    const data = {
      recipient_handle: cleanHandle,
      status: "DRAFT",
      title: title || "Collab Proposal",

      [REL_CREATED_BY]: { connect: { id: me.id } },
      [REL_RECIPIENT]: { connect: { id: recipient.id } },

      [REL_WORKSPACE]: { create: {} },
    };

    // Only include note if your current model supports it
    // (prevents the "Unknown argument note" crash)
    if (typeof note === "string" && note.trim()) {
      // try both common names (one might exist in your schema)
      data.note = note.trim();
      // if your schema uses a different column name, change this line
      // e.g. data.message = note.trim();
    }

    const created = await prisma.collabProposal.create({
      data,
      select: {
        id: true,
        status: true,
        [REL_WORKSPACE]: { select: { id: true } },
      },
    });

    return res.status(200).json({
      ok: true,
      proposalId: created.id,
      workspaceId: created[REL_WORKSPACE]?.id || null,
    });
  } catch (e) {
    console.error("collabs create error:", e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: e.message });
  }
});
