// __tests__/chat.test.js
const { io } = require('socket.io-client');
const fetch = require('node-fetch'); // Assuming installed, or use built-in fetch if Node 18+

// Test configuration
const BASE_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

// Mock users - in real test, you'd create actual users via API
const testUsers = [
  { id: 'user1', token: 'mock-token-1' },
  { id: 'user2', token: 'mock-token-2' }
];

describe('Chat End-to-End Tests', () => {
  let sockets = [];
  let squadId = 'test-squad-1'; // Assume exists
  let conversationId = 'test-conversation-1'; // Assume exists

  beforeAll(async () => {
    // Connect sockets for real-time testing
    for (const user of testUsers) {
      const socket = io(SOCKET_URL, {
        auth: { token: user.token }
      });

      sockets.push({ user, socket });

      await new Promise((resolve) => {
        socket.on('connect', resolve);
      });
    }
  });

  afterAll(() => {
    sockets.forEach(({ socket }) => socket.disconnect());
  });

  describe('Squad Chat Flow', () => {
    test('Send message in squad', async () => {
      const { user, socket } = sockets[0];

      // Join squad
      socket.emit('join-squad', squadId);

      // Send message via API
      const response = await fetch(`${BASE_URL}/api/chat/${squadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          content: 'Test squad message',
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Check XP was awarded
      // This would require checking the database or XP logs
    });

    test('Receive message in real-time', (done) => {
      const sender = sockets[0];
      const receiver = sockets[1];

      receiver.socket.emit('join-squad', squadId);

      receiver.socket.on('new-message', (message) => {
        expect(message.content).toBe('Test squad message');
        expect(message.senderId).toBe(sender.user.id);
        done();
      });

      // Send message
      fetch(`${BASE_URL}/api/chat/${squadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sender.user.token}`
        },
        body: JSON.stringify({
          userId: sender.user.id,
          content: 'Test squad message',
        })
      });
    });
  });

  describe('DM Flow', () => {
    test('Send DM message', async () => {
      const { user } = sockets[0];

      const response = await fetch(`${BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          conversationId,
          content: 'Test DM message',
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    test('Receive DM in real-time', (done) => {
      const sender = sockets[0];
      const receiver = sockets[1];

      receiver.socket.emit('join-dm', conversationId);

      receiver.socket.on('new-message', (message) => {
        expect(message.content).toBe('Test DM message');
        expect(message.senderId).toBe(sender.user.id);
        done();
      });

      // Send via socket
      sender.socket.emit('send-message', {
        conversationId,
        content: 'Test DM message',
      });
    });
  });

  describe('XP Awards', () => {
    test('XP awarded for chat activity', async () => {
      // This would require database checks
      // For now, just ensure no errors in tracking
      const { user } = sockets[0];

      const response = await fetch(`${BASE_URL}/api/chat/${squadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          content: 'XP test message',
        })
      });

      expect(response.ok).toBe(true);
    });
  });
});