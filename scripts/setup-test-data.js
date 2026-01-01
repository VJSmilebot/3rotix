const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
    try {
        // Create test user
        const user = await prisma.user.upsert({
            where: { 
                email: 'test@example.com'  // Changed to use email as unique identifier
            },
            update: {},
            create: {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                handle: 'testuser',
                role: 'CREATOR', // Changed to CREATOR since they'll own a squad
                totalXp: 1000,
                level: 1,
                currentLevelXp: 0,
                rank: 'ROOKIE'
            }
        });

        // Create test squad
        const squad = await prisma.squad.upsert({
            where: { id: 'test-squad-123' },
            update: {},
            create: {
                id: 'test-squad-123',
                name: '3rotix Test Squad',
                slug: 'test-squad',
                ownerId: user.id,
                creatorId: user.id,
                level: 5,
                totalXp: 5500,
                memberCount: 1,
                maxMembers: 100,
                type: 'PUBLIC',
                description: 'A test squad for development'
            }
        });

        // Create squad member entry
        await prisma.squadMember.upsert({
            where: {
                squadId_userId: {
                    squadId: squad.id,
                    userId: user.id
                }
            },
            update: {},
            create: {
                squadId: squad.id,
                userId: user.id,
                role: 'owner',
                contributionXp: 1000
            }
        });

        // Create squad chat
        const chat = await prisma.squadChat.upsert({
            where: { squadId: squad.id },
            update: {},
            create: {
                squadId: squad.id,
                permissions: ['TEXT', 'EMOJI'],
                moderators: {
                    connect: [{ id: user.id }]
                }
            }
        });

        // Add some test messages
        await prisma.squadChatMessage.createMany({
            skipDuplicates: true,
            data: [
                {
                    chatId: chat.id,
                    userId: user.id,
                    content: 'Welcome to the test squad! 👋'
                },
                {
                    chatId: chat.id,
                    userId: user.id,
                    content: 'Testing chat features and permissions!'
                }
            ]
        });

        // Add chat perk
        await prisma.chatPerk.create({
            data: {
                squadId: squad.id,
                permission: 'EMOJI',
                requiredLevel: 5
            }
        });

        console.log('Test data setup complete! You can now run:');
        console.log('npm run dev');
        console.log('Then visit: http://localhost:3000/test-homebase');

    } catch (error) {
        console.error('Error setting up test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupTestData();