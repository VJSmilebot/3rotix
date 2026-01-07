import { prisma } from "../../../../lib/prisma";
import { withAuth } from "../../../../lib/auth-middleware.js";

export default withAuth(async function handler(req, res) {
  const { squadId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = req.user.id;

    const membership = await prisma.squadMember.findFirst({
      where: { squadId: String(squadId), userId },
    });

    return res.status(200).json({
      isMember: !!membership,
      membership: membership || null,
    });
  } catch (error) {
    console.error("Check membership error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
});
