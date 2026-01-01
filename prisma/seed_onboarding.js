// prisma/seed_onboarding.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.onboardingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", activeVersion: 1, locked: false },
  });

  const version = 1;

  const steps = [
    {
      key: "AGE_VERIFY",
      title: "Age verification (18+)",
      description: "Verify once. No minors, no exceptions.",
      category: "compliance",
      sortOrder: 10,
      isRequired: true,
      allowSelfAttest: false,
      requiresReview: false,
      evidenceType: "NONE",
      autoRule: { signalKey: "AGE_VERIFIED", equals: true },
    },
    {
      key: "PAYOUT_CONNECT",
      title: "Connect payout method",
      description: "So you can actually get paid (without chaos).",
      category: "payout",
      sortOrder: 20,
      isRequired: true,
      allowSelfAttest: false,
      autoRule: { signalKey: "PAYOUT_CONNECTED", equals: true },
    },
    {
      key: "SIGN_RELEASE",
      title: "Sign performer release",
      description: "Consent + rights clarity. Keeps everybody protected.",
      category: "compliance",
      sortOrder: 30,
      isRequired: true,
      allowSelfAttest: false,
      autoRule: { signalKey: "PERFORMER_RELEASE_SIGNED", equals: true },
    },
    {
      key: "PROFILE_BASICS",
      title: "Complete your creator profile basics",
      description: "Handle + bio + a clean vibe. Doesn’t need to be perfect.",
      category: "profile",
      sortOrder: 40,
      isRequired: true,
      allowSelfAttest: true,
      evidenceType: "CHECKBOX",
      autoRule: { all: [{ userField: "handle", exists: true }, { userField: "bio", exists: true }] },
    },
    {
      key: "SAFETY_BASELINE",
      title: "Safety baseline",
      description: "No doxxable details, no identifiable background, metadata stripped.",
      category: "safety",
      sortOrder: 50,
      isRequired: true,
      allowSelfAttest: true,
      evidenceType: "CHECKBOX",
      evidenceHint: "You’re confirming you’ve removed location/metadata and protected your identity.",
      requiresReview: false,
    },
  ];

  for (const s of steps) {
    await prisma.onboardingStep.upsert({
      where: { version_key: { version, key: s.key } },
      update: { ...s },
      create: { version, isActive: true, ...s },
    });
  }

  console.log("Seeded onboarding steps v1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
