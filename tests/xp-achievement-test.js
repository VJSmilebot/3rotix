const { PrismaClient } = require('@prisma/client');
const { awardXP } = require('../utils/xp-manager');
const { updateProgress } = require('../utils/achievement-manager');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testXPAndAchievements() {
  try {
    // Get test user
    const user = await prisma.user.findFirst({
      where: { role: 'FAN' }
    });

    // Create test achievement
    const achievement = await prisma.achievement.create({
      data: {
        name: 'Chat Master',
        slug: 'chat-master',
        description: 'Send 100 chat messages',
        category: 'social',
        xpReward: 500,
        targetValue: 100
      }
    });

    // Award XP for actions
    console.log('\nAwarding XP for actions...');
    const xpResult = await awardXP({
      userId: user.id,
      actionType: 'CHAT_MESSAGE'
    });
    console.log('XP Result:', xpResult);

    // Update achievement progress
    console.log('\nUpdating achievement progress...');
    const progressResult = await updateProgress({
      type: 'user',
      achievementSlug: 'chat-master',
      targetId: user.id,
      increment: 50
    });
    console.log('Progress Result:', progressResult);

  } catch (error) {
    console.error('Error:', error);
  }
}

testXPAndAchievements()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });