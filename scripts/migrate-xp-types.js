const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateXPTypes() {
  try {
    // Update all XPLog entries to match enum values
    await prisma.$executeRaw`
      UPDATE "public"."XPLog"
      SET "actionType" = UPPER("actionType")
      WHERE "actionType" IS NOT NULL;
    `;

    console.log('Successfully migrated XP action types');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateXPTypes();