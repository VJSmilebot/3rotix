const { PrismaClient } = require('@prisma/client');
const { createAchievement, trackProgress } = require('../utils/achievements');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testAchievements() {
    try {
        // Get test user
        const user = await prisma.user.findFirst({
            where: { role: 'FAN' }
        });

        console.log('\nInitial User XP:', user.totalXp);

        // Create unique test achievement
        const achievement = await createAchievement({
            name: 'First Steps',
            description: 'Complete your first chat message',
            category: 'social',
            xpReward: 100,
            targetValue: 1,
            slug: `first-steps-test-${Date.now()}`
        });

        console.log('\nAchievement Created:', achievement);

        // Track progress
        const result = await trackProgress({
            type: 'user',
            achievementSlug: achievement.slug,
            targetId: user.id,
            increment: achievement.targetValue
        });

        console.log('\nAchievement Progress:', result);

        if (result.xpAwarded) {
            console.log('\nXP Awarded:', result.xpAwarded);
        }

        // Verify final user XP
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        console.log('\nFinal User XP:', updatedUser.totalXp);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAchievements();