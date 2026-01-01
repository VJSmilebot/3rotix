const { ACHIEVEMENTS } = require('../config/achievements');
const { trackProgress } = require('./achievements');
const { prisma } = require('../lib/prisma.js');

async function getUserProgress(userId) {
    const achievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
            achievement: true
        }
    });

    return {
        completed: achievements.filter(a => a.completed),
        inProgress: achievements.filter(a => !a.completed),
        totalXpEarned: achievements
            .filter(a => a.completed)
            .reduce((sum, a) => sum + a.achievement.xpReward, 0)
    };
}

async function checkCategoryProgress(userId, category) {
    const categoryAchievements = ACHIEVEMENTS[category] || [];
    const results = [];

    for (const achievement of categoryAchievements) {
        const progress = await trackProgress({
            type: 'user',
            achievementSlug: achievement.slug,
            targetId: userId,
            increment: 0 // Just check progress, don't increment
        });
        results.push({ achievement, progress });
    }

    return results;
}

module.exports = {
    getUserProgress,
    checkCategoryProgress
};