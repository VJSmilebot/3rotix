const { PrismaClient } = require('@prisma/client');
const squadChatService = require('../services/squad-chat');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testSquadChat() {
    try {
        // Get test user and squad
        const user = await prisma.user.findFirst({
            where: { role: 'FAN' }
        });

        // Use let for squad since we might need to create it
        let squad = await prisma.squad.findFirst({
            where: { ownerId: user.id }
        });

        if (!squad) {
            console.log('Creating test squad...');
            squad = await prisma.squad.create({
                data: {
                    name: 'Test Squad',
                    slug: `test-squad-${Date.now()}`,
                    ownerId: user.id,
                    creatorId: user.id
                }
            });
        }

        // Create or get squad chat
        console.log('\nInitializing squad chat...');
        let chat = await squadChatService.getSquadChat(squad.id);
        if (!chat) {
            chat = await squadChatService.createChat(squad.id);
        }

        // Send test message
        console.log('\nSending test message...');
        const result = await squadChatService.sendMessage(
            chat.id,
            user.id,
            'Hello squad! 👋'
        );

        console.log('\nMessage sent:', result.message.content);
        console.log('\nRewards earned:');
        console.log('XP:', result.rewards.xp.total);
        console.log('\nAchievements:', 
            result.rewards.achievements
                .filter(a => a.xpAwarded)
                .map(a => a.name)
                .join(', ') || 'None'
        );

        // Get chat history
        console.log('\nChat History:');
        const messages = await squadChatService.getMessages(chat.id, 5);
        messages.forEach(msg => {
            console.log(`${msg.user.handle}: ${msg.content}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSquadChat();