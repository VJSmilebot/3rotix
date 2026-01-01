const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToEnum() {
    try {
        // 1. Create the enum type
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "public"."XPActionType" AS ENUM (
                    'DAILY_CHECK_IN',
                    'CHAT_MESSAGE',
                    'STREAM_WATCH',
                    'ACHIEVEMENT_UNLOCK',
                    'SQUAD_CONTRIBUTION',
                    'SQUAD_CHALLENGE',
                    'SQUAD_LEVEL_UP',
                    'ADMIN_GRANT'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Alter column type with safe casting
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."XPLog"
            ALTER COLUMN "actionType" TYPE "XPActionType"
            USING "actionType"::"XPActionType";
        `);

        console.log('Successfully migrated actionType to enum');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateToEnum();