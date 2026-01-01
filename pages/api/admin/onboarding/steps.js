// pages/api/admin/onboarding/steps.js
import { prisma } from "../../../../lib/prisma";
import { getUserFromAuthHeader } from "../../../../lib/auth";

async function requireAdmin(req) {
  const { user: sbUser, error } = await getUserFromAuthHeader(req);
  if (error) return { ok: false, error };

  const user = await prisma.user.findUnique({ where: { id: sbUser.id } });
  if (!user) return { ok: false, error: "User not found" };

  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
  if (!isAdmin) return { ok: false, error: "Admin only" };

  return { ok: true, sbUser, user };
}

export default async function handler(req, res) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return res.status(403).json({ error: gate.error });

  // GET: list current steps (activeVersion)
  if (req.method === "GET") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    const activeVersion = config?.activeVersion ?? 1;

    const steps = await prisma.onboardingStep.findMany({
      where: { version: activeVersion },
      orderBy: { sortOrder: "asc" },
    });

    return res.status(200).json({ ok: true, activeVersion, steps });
  }

  // POST: create step
  if (req.method === "POST") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    const activeVersion = config?.activeVersion ?? 1;

    if (config?.locked && gate.user.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Checklist is locked (SUPERADMIN only)" });
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

    if (!key || !title) return res.status(400).json({ error: "Missing key/title" });

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
        actorUserId: gate.user.id,
        action: "STEP_EDITED",
        payload: { op: "create", stepId: step.id, key: step.key },
      },
    });

    return res.status(200).json({ ok: true, step });
  }

  // PATCH: update step
  if (req.method === "PATCH") {
    const config = await prisma.onboardingConfig.findUnique({ where: { id: "default" } });
    if (config?.locked && gate.user.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Checklist is locked (SUPERADMIN only)" });
    }

    const { stepId, data } = req.body || {};
    if (!stepId || !data) return res.status(400).json({ error: "Missing stepId/data" });

    const step = await prisma.onboardingStep.update({
      where: { id: String(stepId) },
      data,
    });

    await prisma.onboardingAuditLog.create({
      data: {
        actorUserId: gate.user.id,
        action: "STEP_EDITED",
        payload: { op: "update", stepId: step.id, key: step.key },
      },
    });

    return res.status(200).json({ ok: true, step });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
