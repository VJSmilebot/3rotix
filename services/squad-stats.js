const { prisma } = require('../lib/prisma.js');

class SquadStatsService {
    async getSquadStats(squadId) {
        const [squad, topContributors, recentAchievements] = await Promise.all([
            // Get squad with basic stats
            prisma.squad.findUnique({
                where: { id: squadId },
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            handle: true,
                            image: true
                        }
                    }
                }
            }),
            // Get top 5 contributors
            prisma.squadMember.findMany({
                where: { squadId },
                orderBy: { contributionXp: 'desc' },
                take: 5,
                include: {
                    user: {
                        select: {
                            name: true,
                            handle: true,
                            image: true
                        }
                    }
                }
            }),
            // Get recent achievements
            prisma.squadAchievement.findMany({
                where: { 
                    squadId,
                    completed: true 
                },
                orderBy: { completedAt: 'desc' },
                take: 3,
                include: {
                    achievement: true
                }
            })
        ]);

        return {
            info: squad,
            topContributors,
            recentAchievements,
            levelProgress: {
                current: squad.level,
                xpInLevel: squad.totalXp % 1000, // Example: 1000 XP per level
                xpToNextLevel: 1000 - (squad.totalXp % 1000)
            }
        };
    }
}

module.exports = new SquadStatsService();
