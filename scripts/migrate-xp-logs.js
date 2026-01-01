const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateXPLogs() {
    try {
        // 1. Create temporary column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."XPLog" 
            ADD COLUMN IF NOT EXISTS "newActionType" TEXT;
        `);

        // 2. Update the new column with normalized values
        const updates = [
            'UPDATE "public"."XPLog" SET "newActionType" = \'DAILY_CHECK_IN\' WHERE "actionType" ILIKE \'%daily%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'CHAT_MESSAGE\' WHERE "actionType" ILIKE \'%chat%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'STREAM_WATCH\' WHERE "actionType" ILIKE \'%stream%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'ACHIEVEMENT_UNLOCK\' WHERE "actionType" ILIKE \'%achievement%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'SQUAD_CONTRIBUTION\' WHERE "actionType" ILIKE \'%contribution%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'SQUAD_CHALLENGE\' WHERE "actionType" ILIKE \'%challenge%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'SQUAD_LEVEL_UP\' WHERE "actionType" ILIKE \'%level%\'',
            'UPDATE "public"."XPLog" SET "newActionType" = \'ADMIN_GRANT\' WHERE "actionType" ILIKE \'%admin%\''
        ];

        for (const sql of updates) {
            await prisma.$executeRawUnsafe(sql);
        }

        // 3. Set default for any unmapped values
        await prisma.$executeRawUnsafe(`
            UPDATE "public"."XPLog" 
            SET "newActionType" = 'ADMIN_GRANT' 
            WHERE "newActionType" IS NULL;
        `);

        // 4. Make new column not null
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."XPLog"
            ALTER COLUMN "newActionType" SET NOT NULL;
        `);

        // 5. Drop old column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."XPLog"
            DROP COLUMN "actionType";
        `);

        // 6. Rename new column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."XPLog"
            RENAME COLUMN "newActionType" TO "actionType";
        `);

        console.log('XPLog migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateXPLogs();