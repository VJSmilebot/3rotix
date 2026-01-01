const { PrismaClient } = require('@prisma/client');
const {
  createSquad,
  updateSquadXP
} = require('../api/squads');
const { getSquadPerks } = require('../utils/squad-perks');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSquadPerks() {
  try {
    // Get test user
    const testUser = await prisma.user.findFirst({
      where: { role: 'CREATOR' }
    });

    // Create test squad
    const squad = await createSquad({
      name: 'Perks Test Squad',
      description: 'Testing squad perks system',
      ownerId: testUser.id,
      type: 'PUBLIC'
    });

    const initialPerks = getSquadPerks(squad.level);
    console.log('\nInitial Squad Level 1 Perks:', initialPerks);

    // Add XP for level 2
    const level2Update = await updateSquadXP({
      squadId: squad.id,
      amount: 1500
    });
    console.log('\nLevel 2 Squad Update:', {
      level: level2Update.level,
      totalXp: level2Update.totalXp,
      perks: level2Update.perks
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testSquadPerks()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });