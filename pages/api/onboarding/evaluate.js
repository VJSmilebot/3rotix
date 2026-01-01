// pages/api/onboarding/evaluate.js
import { prisma } from "../../../lib/prisma";
import { getUserFromAuthHeader } from "../../../lib/auth";
import { evaluateRule } from "../../../utils/onboardingRules";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user: sbUser, error } = await getUserFromAuthHeader(req);
  if (error) return res.status(401).json({ error });

  const userId = sbUser.id;

  const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
  const activeVersion = config?.activeVersion ?? 1;

  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRecord) return res.status(404).json({ error: "User record not found in Prisma User table" });

  const [steps, existingProgress, signals] = await Promise.all([
    prisma.onboardingStep.findMany({
      where: { isActive: true, version: activeVersion },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.userOnboardingStep.findMany({ where: { userId } }),
    prisma.onboardingSignal.findMany({ where: { userId } }),
  ]);

  const progressByStepId = {};
  for (const p of existingProgress) progressByStepId[p.stepId] = p;

  const signalsByKey = {};
  for (const s of signals) signalsByKey[s.key] = s;

  const updates = [];
  for (const step of steps) {
    if (!step.autoRule) continue;

    const passes = evaluateRule({ rule: step.autoRule, userRecord, signalsByKey });
    if (!passes) continue;

    const existing = progressByStepId[step.id];
    const alreadyComplete = existing?.status === "COMPLETE" || existing?.status === "NEEDS_REVIEW";
    if (alreadyComplete && existing?.autoDetected) continue;

    // If it’s review-required, keep it NEEDS_REVIEW
    const newStatus = step.requiresReview ? "NEEDS_REVIEW" : "COMPLETE";

    updates.push(
      prisma.userOnboardingStep.upsert({
        where: { userId_stepId: { userId, stepId: step.id } },
        update: {
          status: newStatus,
          autoDetected: true,
          completedAt: new Date(),
          completedBy: "SYSTEM",
        },
        create: {
          userId,
          stepId: step.id,
          status: newStatus,
          autoDetected: true,
          completedAt: new Date(),
          completedBy: "SYSTEM",
        },
      })
    );
  }

  const results = await prisma.$transaction(updates);

  await prisma.onboardingAuditLog.create({
    data: {
      userId,
      actorUserId: userId,
      action: "AUTO_EVALUATED",
      payload: { updatedCount: results.length },
    },
  });

  return res.status(200).json({ ok: true, updatedCount: results.length });
}
