// pages/api/onboarding/steps/[stepId]/complete.js
import { prisma } from "../../../../../lib/prisma";
import { getUserFromAuthHeader } from "../../../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user: sbUser, error } = await getUserFromAuthHeader(req);
  if (error) return res.status(401).json({ error });

  const userId = sbUser.id;
  const { stepId } = req.query;
  const { evidenceUrl = null, evidenceJson = null, notes = null } = req.body || {};

  const step = await prisma.onboardingStep.findUnique({ where: { id: String(stepId) } });
  if (!step || !step.isActive) return res.status(404).json({ error: "Step not found" });

  if (!step.allowSelfAttest) {
    return res.status(403).json({ error: "This step cannot be self-completed" });
  }

  const status = step.requiresReview ? "NEEDS_REVIEW" : "COMPLETE";

  const updated = await prisma.userOnboardingStep.upsert({
    where: { userId_stepId: { userId, stepId: step.id } },
    update: {
      status,
      selfAttested: true,
      completedAt: new Date(),
      completedBy: "USER",
      evidenceUrl,
      evidenceJson,
      notes,
    },
    create: {
      userId,
      stepId: step.id,
      status,
      selfAttested: true,
      completedAt: new Date(),
      completedBy: "USER",
      evidenceUrl,
      evidenceJson,
      notes,
    },
  });

  await prisma.onboardingAuditLog.create({
    data: {
      userId,
      actorUserId: userId,
      action: "STEP_COMPLETED",
      payload: { stepId: step.id, status, selfAttested: true },
    },
  });

  return res.status(200).json({ ok: true, progress: updated });
}
