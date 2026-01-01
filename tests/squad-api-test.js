const { PrismaClient } = require('@prisma/client');
const {
  createSquad,
  addMember,
  getSquadDetails,
  updateSquadXP
} = require('../api/squads');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSquadAPI() {
  try {
    // Get existing user for testing
    const testUser = await prisma.user.findFirst({
      where: { role: 'CREATOR' }
    });

    if (!testUser) {
      throw new Error('No test user found');
    }

    // Test squad creation
    console.log('\nCreating squad...');
    const squad = await createSquad({
      name: 'API Test Squad',
      description: 'Testing squad API functions',
      ownerId: testUser.id,
      type: 'PUBLIC'
    });
    console.log('Squad created:', squad);

    // Test adding member
    console.log('\nAdding member...');
    const memberResult = await addMember({
      squadId: squad.id,
      userId: testUser.id,
      role: 'member'
    });
    console.log('Member added:', memberResult);

    // Test XP update
    console.log('\nUpdating squad XP...');
    const updatedSquad = await updateSquadXP({
      squadId: squad.id,
      amount: 100
    });
    console.log('Squad XP updated:', updatedSquad);

    // Get final squad state
    console.log('\nFinal squad state:');
    const finalState = await getSquadDetails(squad.id);
    console.log(JSON.stringify(finalState, null, 2));

  } catch (error) {
    console.error('Error in squad API test:', error);
  }
}

testSquadAPI()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });