const { PrismaClient } = require('@prisma/client');
const {
  createSquad,
  addMember,
  updateMemberRole,
  updateSquadXP,
  getSquadDetails
} = require('../api/squads');
const { canUseFeature } = require('../utils/squad-features');
const { getSquadPerks } = require('../utils/squad-perks');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSquadRoles() {
  try {
    // Get test users
    const [owner, member] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'CREATOR' } }),
      prisma.user.findFirst({ where: { role: 'FAN' } })
    ]);

    // Create squad
    let squad = await createSquad({
      name: 'Roles Test Squad',
      description: 'Testing squad roles system',
      ownerId: owner.id,
      type: 'PUBLIC'
    });

    // Add member
    await addMember({
      squadId: squad.id,
      userId: member.id,
      role: 'member'
    });

    // Level up squad to unlock features
    await updateSquadXP({
      squadId: squad.id,
      amount: 1500
    });

    // Get updated squad details
    squad = await getSquadDetails(squad.id);

    // Promote member to moderator
    const promotedMember = await updateMemberRole({
      squadId: squad.id,
      userId: member.id,
      newRole: 'moderator'
    });

    console.log('\nPromoted Member:', promotedMember);
    console.log('\nSquad Level:', squad.level);
    console.log('Available Features:', getSquadPerks(squad.level).features);

    // Test all moderator permissions
    const permissions = {
      chat: canUseFeature(squad, member.id, 'chat'),
      manage_chat: canUseFeature(squad, member.id, 'manage_chat'),
      create_events: canUseFeature(squad, member.id, 'create_events'),
      manage_members: canUseFeature(squad, member.id, 'manage_members')
    };

    console.log('\nPermission Check:', {
      role: promotedMember.role,
      ...permissions
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testSquadRoles()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });