// pages/api/dev/seed.js
import { prisma } from "../../../lib/prisma";
export default async function handler(_req, res) {
  try {
    const user = await prisma.user.upsert({
      where: { email: "fan@example.com" },
      update: {},
      create: { email: "fan@example.com", name: "Demo Fan" },
    });
    res.status(200).json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
