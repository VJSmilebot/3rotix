const { PrismaClient } = require('@prisma/client');
const {
  createSquad,
  updateSquadXP
} = require('../api/squads');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSquadProgression() {
  try {
    // Get test user
    const testUser = await prisma.user.findFirst({
      where: { role: 'CREATOR' }
    });

    // Create test squad
    const squad = await createSquad({
      name: 'Level Test Squad',
      description: 'Testing squad progression',
      ownerId: testUser.id,
      type: 'PUBLIC'
    });
    console.log('\nInitial Squad:', squad);

    // Add XP to trigger level up
    const xpUpdate = await updateSquadXP({
      squadId: squad.id,
      amount: 1500
    });
    console.log('\nAfter XP Update:', xpUpdate);

    if (xpUpdate.levelUp) {
      console.log('\nSquad Leveled Up!');
      console.log('XP needed for next level:', xpUpdate.nextLevelXp);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testSquadProgression()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });