// pages/api/onboarding/steps.js
import { prisma } from "../../../lib/prisma";
import { getUserFromAuthHeader } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user: sbUser, error } = await getUserFromAuthHeader(req);
  if (error) return res.status(401).json({ error });

  const userId = sbUser.id;

  const config = await prisma.onboardingConfig.findUnique({
    where: { id: "default" },
  });

  const activeVersion = config?.activeVersion ?? 1;

  const [steps, userSteps] = await Promise.all([
    prisma.onboardingStep.findMany({
      where: { isActive: true, version: activeVersion },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.userOnboardingStep.findMany({
      where: { userId },
    }),
  ]);

  const map = {};
  for (const us of userSteps) map[us.stepId] = us;

  const merged = steps.map((s) => ({
    step: s,
    progress: map[s.id] || null,
  }));

  return res.status(200).json({ ok: true, activeVersion, items: merged });
}
