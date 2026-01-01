const { trackChatActivity } = require('../utils/chat-tracker');
const { getIO } = require('../utils/socket-server');
const { prisma } = require('../lib/prisma.js');

class SquadChatService {
    async createChat(squadId) {
        return prisma.squadChat.create({
            data: {
                squadId,
                isOpen: true,
                permissions: ['TEXT']
            },
            include: {
                squad: true
            }
        });
    }

    async sendMessage(chatId, userId, content) {
        return prisma.$transaction(async (tx) => {
            // Check if chat is open and user isn't muted
            const chat = await tx.squadChat.findUnique({
                where: { id: chatId },
                include: { 
                    bannedUsers: true,
                    squad: {
                        include: {
                            chatPerks: true
                        }
                    }
                }
            });

            if (!chat) throw new Error('Chat not found');
            if (!chat.isOpen) throw new Error('Chat is closed');
            if (chat.bannedUsers.some(u => u.id === userId)) {
                throw new Error('You are banned from this chat');
            }
            if (chat.mutedUntil && chat.mutedUntil > new Date()) {
                throw new Error('You are muted');
            }

            // Check content permissions
            if (content.includes('http') && !chat.permissions.includes('LINKS')) {
                throw new Error('Links are not allowed');
            }
            if ((content.match(/:[a-z_]+:/g) || []).length > 0 && !chat.permissions.includes('EMOJI')) {
                throw new Error('Emojis are not allowed');
            }

            // Create message
            const message = await tx.squadChatMessage.create({
                data: {
                    chatId,
                    userId,
                    content
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            handle: true,
                            image: true,
                            role: true
                        }
                    }
                }
            });

            // Track activity and rewards
            const rewards = await trackChatActivity({
                 userId,
                 messageCount: 1,
                 messageText: content, // this lets the uniqueness / anti-spam rules work
            });
            
            // Emit new message to squad members
            const io = getIO();
            io.to(`squad:${chat.squadId}`).emit('new-message', { message, rewards });

            return { message, rewards };
        });
    }

    async deleteMessage(messageId) {
        const message = await prisma.squadChatMessage.delete({
            where: { id: messageId },
            include: { chat: true }
        });

        // Notify squad members of deletion
        const io = getIO();
        io.to(`squad:${message.chat.squadId}`).emit('delete-message', { messageId });

        return message;
    }

    async muteUser(squadId, userId, durationSeconds) {
        const result = await prisma.$transaction(async (tx) => {
            const chat = await tx.squadChat.findUnique({
                where: { squadId }
            });

            if (!chat) throw new Error('Chat not found');

            const mutedUntil = new Date();
            mutedUntil.setSeconds(mutedUntil.getSeconds() + durationSeconds);

            return tx.squadChat.update({
                where: { id: chat.id },
                data: {
                    mutedUntil
                }
            });
        });

        // Notify squad members of mute
        const io = getIO();
        io.to(`squad:${squadId}`).emit('user-muted', {
            userId,
            duration: durationSeconds
        });

        return result;
    }

    async banUser(squadId, userId) {
        return prisma.squadChat.update({
            where: { squadId },
            data: {
                bannedUsers: {
                    connect: { id: userId }
                }
            }
        });
    }

    async unbanUser(squadId, userId) {
        return prisma.squadChat.update({
            where: { squadId },
            data: {
                bannedUsers: {
                    disconnect: { id: userId }
                }
            }
        });
    }

    async updateChatSettings(squadId, settings) {
        return prisma.squadChat.update({
            where: { squadId },
            data: {
                isOpen: settings.isOpen,
                permissions: settings.permissions
            }
        });
    }

    async updateChatPerk(squadId, permission, requiredLevel) {
        return prisma.chatPerk.upsert({
            where: {
                squadId_permission: {
                    squadId,
                    permission
                }
            },
            create: {
                squadId,
                permission,
                requiredLevel
            },
            update: {
                requiredLevel
            }
        });
    }

    async getMessages(chatId, limit = 50, before) {
        return prisma.squadChatMessage.findMany({
            where: {
                chatId,
                ...(before && { createdAt: { lt: before } })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        handle: true,
                        image: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }
}

module.exports = new SquadChatService();