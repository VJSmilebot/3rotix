const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function createTestUsers() {
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'squad-owner@example.com' },
      update: {},
      create: {
        email: 'squad-owner@example.com',
        name: 'Squad Owner',
        handle: 'squadowner',
        role: 'CREATOR',
        totalXp: 1000,
        rank: 'CULT'
      }
    }),
    prisma.user.upsert({
      where: { email: 'member1@example.com' },
      update: {},
      create: {
        email: 'member1@example.com',
        name: 'Member One',
        handle: 'member1',
        role: 'FAN',
        totalXp: 500,
        rank: 'CREW'
      }
    })
  ]);

  console.log('\nTest Users Created:', users);
  return users;
}

async function createAndPopulateSquad(owner) {
  const squad = await prisma.squad.create({
    data: {
      name: 'Elite Gaming Squad',
      slug: `elite-gaming-${Date.now()}`,
      description: 'Top tier gaming squad',
      ownerId: owner.id,
      creatorId: owner.id,
      type: 'PUBLIC',
      level: 2,
      totalXp: 1500
    }
  });

  console.log('\nSquad Created:', squad);
  return squad;
}

async function addMemberToSquad(squad, user) {
  const member = await prisma.squadMember.create({
    data: {
      squadId: squad.id,
      userId: user.id,
      role: 'member',
      contributionXp: 100
    },
    include: {
      user: {
        select: {
          handle: true,
          totalXp: true,
          rank: true
        }
      }
    }
  });

  // Update squad member count
  await prisma.squad.update({
    where: { id: squad.id },
    data: {
      memberCount: {
        increment: 1
      }
    }
  });

  console.log('\nMember Added:', member);
  return member;
}

async function main() {
  try {
    // Create test users
    const [owner, member] = await createTestUsers();

    // Create and populate squad
    const squad = await createAndPopulateSquad(owner);

    // Add member to squad
    await addMemberToSquad(squad, member);

    // Verify final squad state
    const finalSquad = await prisma.squad.findUnique({
      where: { id: squad.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                handle: true,
                totalXp: true,
                rank: true
              }
            }
          }
        }
      }
    });

    console.log('\nFinal Squad State:', JSON.stringify(finalSquad, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });