const ACHIEVEMENTS = {
    SOCIAL: [
        {
            slug: 'first-chat',
            name: 'First Chat',
            description: 'Send your first chat message',
            category: 'social',
            xpReward: 100,
            targetValue: 1
        },
        {
            slug: 'chat-master',
            name: 'Chat Master',
            description: 'Send 1000 chat messages',
            category: 'social',
            xpReward: 500,
            targetValue: 1000
        }
    ],
    SQUAD: [
        {
            slug: 'squad-founder',
            name: 'Squad Founder',
            description: 'Create your first squad',
            category: 'squad',
            xpReward: 200,
            targetValue: 1
        },
        {
            slug: 'squad-leader',
            name: 'Squad Leader',
            description: 'Reach level 5 with your squad',
            category: 'squad',
            xpReward: 1000,
            targetValue: 5
        }
    ],
    PROGRESSION: [
        {
            slug: 'level-up',
            name: 'Level Up!',
            description: 'Reach level 10',
            category: 'progression',
            xpReward: 500,
            targetValue: 10
        }
    ]
};

module.exports = { ACHIEVEMENTS };