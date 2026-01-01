// test-chat.js - Manual end-to-end test for chat flows
const io = require('socket.io-client');
const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Mock tokens - in real scenario, get from login
const tokens = {
  user1: process.env.TEST_TOKEN_1 || 'mock-token-1',
  user2: process.env.TEST_TOKEN_2 || 'mock-token-2'
};

async function testSquadChat() {
  console.log('Testing Squad Chat Flow...');

  try {
    // Send message to squad
    const response = await fetch(`${BASE_URL}/api/chat/test-squad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.user1}`
      },
      body: JSON.stringify({
        userId: 'test-user-1',
        content: 'Test squad message from E2E test',
      })
    });

    if (response.ok) {
      console.log('✅ Squad message sent successfully');
    } else {
      console.log('❌ Failed to send squad message:', await response.text());
    }
  } catch (error) {
    console.error('❌ Squad chat test error:', error.message);
  }
}

async function testDMChat() {
  console.log('Testing DM Flow...');

  try {
    // Send DM
    const response = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.user1}`
      },
      body: JSON.stringify({
        conversationId: 'test-conversation',
        content: 'Test DM message from E2E test',
      })
    });

    if (response.ok) {
      console.log('✅ DM message sent successfully');
    } else {
      console.log('❌ Failed to send DM:', await response.text());
    }
  } catch (error) {
    console.error('❌ DM test error:', error.message);
  }
}

async function testRealTime() {
  console.log('Testing Real-time DM...');

  const socket = io(BASE_URL, {
    auth: { token: tokens.user1 }
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');

    socket.emit('join-dm', 'test-conversation');

    socket.on('new-message', (message) => {
      console.log('✅ Received real-time message:', message.content);
      socket.disconnect();
    });

    // Send message via socket
    socket.emit('send-message', {
      conversationId: 'test-conversation',
      content: 'Real-time test message',
    });
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Socket connection error:', error.message);
  });
}

async function runTests() {
  console.log('Starting Chat E2E Tests...\n');

  await testSquadChat();
  console.log('');

  await testDMChat();
  console.log('');

  await testRealTime();

  console.log('\nTests completed.');
}

runTests().catch(console.error);