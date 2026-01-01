const { PrismaClient } = require('@prisma/client');
const { createAchievement } = require('../utils/achievements');
const { ACHIEVEMENTS } = require('../config/achievements');
const { getUserProgress, checkCategoryProgress } = require('../utils/progress-tracker');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testProgressTracker() {
    try {
        // Get test user
        const user = await prisma.user.findFirst({
            where: { role: 'FAN' }
        });

        // Initialize achievements
        for (const achievement of ACHIEVEMENTS.SOCIAL) {
            await createAchievement(achievement);
        }

        // Check user progress
        console.log('\nChecking Social Achievements...');
        const socialProgress = await checkCategoryProgress(user.id, 'SOCIAL');
        console.log(JSON.stringify(socialProgress, null, 2));

        // Get overall progress
        console.log('\nOverall Progress:');
        const progress = await getUserProgress(user.id);
        console.log(JSON.stringify(progress, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testProgressTracker();