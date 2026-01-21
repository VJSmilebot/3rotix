// pages/api/collabs/proposals/list.js
import { prisma } from "../../../../lib/prisma";
import { withAuth } from "../../../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const me = req.user; // Prisma public User from your middleware
    const box = String(req.query.box || "inbox").toLowerCase(); // inbox | outbox | all
    const take = Math.min(parseInt(req.query.take || "50", 10) || 50, 200);

    // Your introspected Prisma model uses THESE relation names.
    const REL_CREATED_BY = "User_CollabProposal_created_by_idToUser";
    const REL_RECIPIENT = "User_CollabProposal_recipient_user_idToUser";
    const REL_WORKSPACE = "CollabWorkspace";

    let where = {};
    if (box === "inbox") {
      where = {
        [REL_RECIPIENT]: { is: { id: me.id } },
      };
    } else if (box === "outbox") {
      where = {
        [REL_CREATED_BY]: { is: { id: me.id } },
      };
    } else {
      where = {
        OR: [
          { [REL_RECIPIENT]: { is: { id: me.id } } },
          { [REL_CREATED_BY]: { is: { id: me.id } } },
        ],
      };
    }

    const rows = await prisma.collabProposal.findMany({
      where,
      orderBy: { created_at: "desc" }, // snake_case from db pull
      take,
      select: {
        id: true,
        status: true,
        title: true,
        recipient_handle: true,
        created_at: true,
        updated_at: true,

        [REL_CREATED_BY]: { select: { id: true, handle: true } },
        [REL_RECIPIENT]: { select: { id: true, handle: true } },
        [REL_WORKSPACE]: { select: { id: true, status: true } },
      },
    });

    // Normalize to the names your UI expects (createdBy / recipient / workspace)
    const items = rows.map((p) => ({
      id: p.id,
      status: p.status,
      title: p.title,
      recipientHandle: p.recipient_handle,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p[REL_CREATED_BY],
      recipient: p[REL_RECIPIENT],
      workspace: p[REL_WORKSPACE],
    }));

    return res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("collabs list error:", e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});
