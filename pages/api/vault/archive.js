// pages/api/vault/archive.js
import { prisma } from "../../../lib/prisma";
import { getSessionUser } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getSessionUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id, action } = req.body; // action: "ARCHIVE" | "UNARCHIVE" | "DELETE"

  if (!id || !["ARCHIVE", "UNARCHIVE", "DELETE"].includes(action)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const work = await prisma.registeredWork.findFirst({
    where: { id, ownerId: user.id }
  });

  if (!work) {
    return res.status(404).json({ error: "Work not found" });
  }

  let data = {};
  const now = new Date();

  if (action === "ARCHIVE") {
    data = { status: "ARCHIVED", archivedAt: now };
  } else if (action === "UNARCHIVE") {
    data = { status: "ACTIVE", archivedAt: null };
  } else if (action === "DELETE") {
    data = { status: "DELETED", deletedAt: now };
  }

  const updated = await prisma.registeredWork.update({
    where: { id },
    data
  });

  return res.status(200).json({ work: updated });
}
 