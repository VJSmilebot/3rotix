// pages/api/vault/proof/[id].js
import { prisma } from "../../../../lib/prisma";
import { getSessionUser } from "../../../../lib/auth";

export default async function handler(req, res) {
  const user = await getSessionUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  const work = await prisma.registeredWork.findFirst({
    where: { id, ownerId: user.id },
    include: {
      fingerprints: true,
      media: true
    }
  });

  if (!work) {
    return res.status(404).json({ error: "Work not found" });
  }

  const proof = {
    workId: work.id,
    ownerId: work.ownerId,
    title: work.title,
    description: work.description,
    registeredAt: work.registeredAt,
    status: work.status,
    media: {
      id: work.media.id,
      // include whatever fields matter: filename, storage path, duration, etc.
    },
    fingerprints: work.fingerprints.map((fp) => ({
      algorithm: fp.algorithm,
      value: fp.value,
      createdAt: fp.createdAt
    }))
  };

  res.setHeader("Content-Type", "application/json");
  res.status(200).json(proof);
}
