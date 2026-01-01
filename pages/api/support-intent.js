// pages/api/support-intent.js

import { getSupabaseUser } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getSupabaseUser(req, res);
    const fanId = user?.id || null;

    const { creatorId, method } = req.body;

    if (!creatorId || !method) {
      return res.status(400).json({ error: "Missing creatorId or method" });
    }

    await prisma.supportIntent.create({
      data: {
        creatorId,
        method,
        fanId,
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error creating support intent:", err);
    // Don’t break UX if logging fails
    return res.status(200).json({ ok: false });
  }
}
