const { PrismaClient } = require('@prisma/client');
const { createAchievement } = require('../utils/achievements');
const { ACHIEVEMENTS } = require('../config/achievements');
const { trackChatActivity } = require('../utils/chat-tracker');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testChatTracking() {
    try {
        // Get test user
        const user = await prisma.user.findFirst({
            where: { role: 'FAN' }
        });

        console.log('\nInitial User State:');
        console.log('XP:', user.totalXp);
        console.log('Level:', user.level);

        // Initialize chat achievements if needed
        for (const achievement of ACHIEVEMENTS.SOCIAL) {
            await createAchievement(achievement);
        }

        // Simulate some chat activity
        console.log('\nTracking chat messages (5 messages)...');
        const chatResult = await trackChatActivity({
            userId: user.id,
            messageCount: 5
        });

        console.log('\nActivity Results:');
        console.log('XP Breakdown:');
        console.log('  Chat XP:', chatResult.xp.chat);
        console.log('  Achievement XP:', chatResult.xp.achievements);
        console.log('  Total XP:', chatResult.xp.total);
        
        console.log('\nAchievements Updated:');
        chatResult.achievements.forEach(a => {
            console.log(`\n- ${a.name} (${a.slug})`);
            console.log(`  Description: ${a.description}`);
            console.log(`  Progress: ${a.progress}/${a.target}`);
            console.log(`  Status: ${a.completed ? 'Completed!' : 'In Progress'}`);
            if (a.xpAwarded) {
                console.log(`  XP Awarded: ${a.xpAwarded}`);
            }
            if (a.previouslyAwarded) {
                console.log(`  Note: XP previously awarded`);
            }
        });

        // Get final user state
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        console.log('\nFinal User State:');
        console.log('XP:', updatedUser.totalXp);
        console.log('Level:', updatedUser.level);
        console.log('Total XP Gained:', updatedUser.totalXp - user.totalXp);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testChatTracking();