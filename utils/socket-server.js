const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let io;

function initSocket(server) {
    io = new Server(server);

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify token with Supabase
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                throw new Error('Invalid token');
            }

            // Attach user to socket
            socket.user = user;
            socket.userId = user.id;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.email}`);

        socket.on('join-squad', (squadId) => {
            socket.join(`squad:${squadId}`);
            console.log(`User ${socket.userId} joined squad: ${squadId}`);
        });

        socket.on('leave-squad', (squadId) => {
            socket.leave(`squad:${squadId}`);
            console.log(`User ${socket.userId} left squad: ${squadId}`);
        });

        socket.on('join-dm', (conversationId) => {
            const room = `dm-${conversationId}`;
            socket.join(room);
            console.log(`User ${socket.userId} joined DM room: ${room}`);
        });

        socket.on('leave-dm', (conversationId) => {
            const room = `dm-${conversationId}`;
            socket.leave(room);
            console.log(`User ${socket.userId} left DM room: ${room}`);
        });

        socket.on('send-message', async (data) => {
            const { conversationId, content, mediaUrls, mediaType } = data;
            try {
                // Import prisma here to avoid circular dependencies
                const { prisma } = require('../lib/prisma.js');

                // Get conversation to determine receiver
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    select: { participant1Id: true, participant2Id: true },
                });

                if (!conversation) {
                    socket.emit('message-error', { error: 'Conversation not found' });
                    return;
                }

                const receiverId = conversation.participant1Id === socket.userId ? conversation.participant2Id : conversation.participant1Id;

                // Create the message in database
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: socket.userId,
                        receiverId,
                        content,
                        mediaUrls,
                        mediaType,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                displayName: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                });

                // Broadcast to the DM room
                const room = `dm-${conversationId}`;
                io.to(room).emit('new-message', message);

                console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.email}`);
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

module.exports = {
    initSocket,
    getIO
};