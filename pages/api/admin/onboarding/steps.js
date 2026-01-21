// pages/api/admin/onboarding/steps.js
import { prisma } from "../../../../lib/prisma.js";
import { requireAdmin } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  const user = await requireAdmin(req, res);
  
  if (!user) {
    return; // requireAdmin already sent 401/403
  }

  // GET: list current steps (activeVersion)
  if (req.method === "GET") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    const activeVersion = config?.activeVersion ?? 1;

    const steps = await prisma.onboardingStep.findMany({
      where: { version: activeVersion },
      orderBy: { sortOrder: "asc" },
    });

    return res.status(200).json({ ok: true, data: { activeVersion, steps } });
  }

  // POST: create step
  if (req.method === "POST") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    const activeVersion = config?.activeVersion ?? 1;

    if (config?.locked && !user.isSuperAdmin) {
      return res.status(403).json({ ok: false, error: "Checklist is locked (SUPERADMIN only)" });
    }

    const {
      key,
      title,
      description = null,
      category = "core",
      sortOrder = 0,
      isActive = true,
      isRequired = true,
      allowSelfAttest = true,
      requiresReview = false,
      jurisdictions = null,
      evidenceType = "NONE",
      evidenceHint = null,
      autoRule = null,
      xpReward = 0,
      badgeKey = null,
    } = req.body || {};

    if (!key || !title) return res.status(400).json({ ok: false, error: "Missing key/title" });

    const step = await prisma.onboardingStep.create({
      data: {
        version: activeVersion,
        key,
        title,
        description,
        category,
        sortOrder,
        isActive,
        isRequired,
        allowSelfAttest,
        requiresReview,
        jurisdictions,
        evidenceType,
        evidenceHint,
        autoRule,
        xpReward,
        badgeKey,
      },
    });

    await prisma.onboardingAuditLog.create({
      data: {
        actorUserId: user.id,
        action: "STEP_EDITED",
        payload: { op: "create", stepId: step.id, key: step.key },
      },
    });

    return res.status(200).json({ ok: true, data: { step } });
  }

  // PATCH: update step
  if (req.method === "PATCH") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    if (config?.locked && !user.isSuperAdmin) {
      return res.status(403).json({ ok: false, error: "Checklist is locked (SUPERADMIN only)" });
    }

    const { stepId, data } = req.body || {};
    if (!stepId || !data) return res.status(400).json({ ok: false, error: "Missing stepId/data" });

    const step = await prisma.onboardingStep.update({
      where: { id: String(stepId) },
      data,
    });

    await prisma.onboardingAuditLog.create({
      data: {
        actorUserId: user.id,
        action: "STEP_EDITED",
        payload: { op: "update", stepId: step.id, key: step.key },
      },
    });

    return res.status(200).json({ ok: true, data: { step } });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
