const { awardXP } = require('./xp-manager');
const { prisma } = require('../lib/prisma.js');

async function updateProgress({ 
  type, 
  achievementSlug, 
  targetId, 
  increment = 1 
}) {
  const isSquad = type === 'squad';
  
  return prisma.$transaction(async (tx) => {
    // Get achievement
    const achievement = await tx.achievement.findUnique({ 
      where: { slug: achievementSlug }
    });

    if (!achievement) throw new Error('Achievement not found');

    // Update or create progress
    const model = isSquad ? tx.squadAchievement : tx.userAchievement;
    const where = {
      [`${type}Id`]: targetId,
      achievementId: achievement.id
    };

    let progress = await model.findFirst({ where });
    
    if (!progress) {
      progress = await model.create({
        data: {
          ...where,
          progress: increment
        }
      });
    } else {
      progress = await model.update({
        where: { id: progress.id },
        data: {
          progress: {
            increment
          }
        }
      });
    }

    // Check for completion
    if (!progress.completed && progress.progress >= achievement.targetValue) {
      progress = await model.update({
        where: { id: progress.id },
        data: {
          completed: true,
          completedAt: new Date()
        }
      });

      // Award XP if user achievement
      if (!isSquad) {
        await awardXP({
          userId: targetId,
          actionType: 'ACHIEVEMENT_UNLOCK',
          amount: achievement.xpReward,
          refId: achievement.id
        });
      }
    }

    return progress;
  });
}

module.exports = {
  updateProgress
};
