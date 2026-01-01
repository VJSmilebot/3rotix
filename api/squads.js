const { calculateSquadLevel, getNextLevelXp } = require('../utils/squad-progression');
const { prisma } = require('../lib/prisma.js');
const { getSquadPerks } = require('../utils/squad-perks');

async function createSquad({ name, description, ownerId, type = 'PUBLIC' }) {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  
  return prisma.squad.create({
    data: {
      name,
      slug,
      description,
      ownerId,
      creatorId: ownerId,
      type
    },
    include: {
      owner: {
        select: {
          handle: true,
          rank: true
        }
      },
      members: true
    }
  });
}

async function addMember({ squadId, userId, role = 'member' }) {
  // Start transaction
  return prisma.$transaction(async (tx) => {
    // Add member
    const member = await tx.squadMember.create({
      data: {
        squadId,
        userId,
        role,
        contributionXp: 0
      }
    });

    // Update squad member count
    const squad = await tx.squad.update({
      where: { id: squadId },
      data: {
        memberCount: {
          increment: 1
        }
      }
    });

    return { member, squad };
  });
}

async function getSquadDetails(squadId) {
  return prisma.squad.findUnique({
    where: { id: squadId },
    include: {
      owner: {
        select: {
          handle: true,
          rank: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              handle: true,
              rank: true
            }
          }
        }
      }
    }
  });
}

async function updateSquadXP({ squadId, amount }) {
  return prisma.$transaction(async (tx) => {
    const squad = await tx.squad.findUnique({
      where: { id: squadId }
    });

    const newTotalXp = squad.totalXp + amount;
    const newLevel = calculateSquadLevel(newTotalXp);
    const levelUp = newLevel > squad.level;
    const newPerks = getSquadPerks(newLevel);

    // Update squad with new stats
    const updatedSquad = await tx.squad.update({
      where: { id: squadId },
      data: {
        totalXp: newTotalXp,
        level: newLevel
      }
    });

    if (levelUp) {
      // Create level up notification
      await tx.xPLog.create({
        data: {
          userId: squad.ownerId,
          actionType: 'SQUAD_LEVEL_UP',
          xpValue: 500,
          refId: squadId
        }
      });
    }

    return {
      ...updatedSquad,
      levelUp,
      nextLevelXp: getNextLevelXp(newLevel),
      perks: newPerks
    };
  });
}

async function updateMemberRole({ squadId, userId, newRole }) {
  return prisma.$transaction(async (tx) => {
    // Verify squad exists and user is member
    const squad = await tx.squad.findUnique({
      where: { id: squadId },
      include: {
        members: true
      }
    });

    if (!squad) throw new Error('Squad not found');
    
    const member = squad.members.find(m => m.userId === userId);
    if (!member) throw new Error('User is not a squad member');

    // Update member role
    const updatedMember = await tx.squadMember.update({
      where: {
        squadId_userId: {
          squadId,
          userId
        }
      },
      data: {
        role: newRole
      },
      include: {
        user: {
          select: {
            handle: true,
            rank: true
          }
        }
      }
    });

    return updatedMember;
  });
}

module.exports = {
  createSquad,
  addMember,
  getSquadDetails,
  updateSquadXP,
  updateMemberRole
};