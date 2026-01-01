import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import Head from 'next/head';

export default function TestSuite() {
  const [user, setUser] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState({});

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    }
    init();
  }, []);

  // Enhanced test result logger with error details
  function logResult(testName, success, message, data = null, error = null) {
    const errorDetails = error ? {
      name: error.name || 'Error',
      message: error.message || message,
      stack: error.stack,
      response: error.response,
      status: error.status,
      statusText: error.statusText,
    } : null;

    setResults(prev => ({
      ...prev,
      [testName]: {
        success,
        message,
        data,
        error: errorDetails,
        timestamp: new Date().toISOString(),
        suggestions: getSuggestions(testName, message, errorDetails),
      },
    }));
  }

  // AI-like suggestions based on error
  function getSuggestions(testName, message, error) {
    const suggestions = [];

    // Parse common errors
    if (message.includes('HTML') || message.includes('DOCTYPE')) {
      suggestions.push({
        icon: '🔧',
        title: 'API Route Not Found',
        description: 'The endpoint exists but might have an error',
        fixes: [
          'Check the console for server-side errors',
          'Verify the API file exports a default handler function',
          'Make sure Prisma client is initialized',
        ],
        action: 'Check the terminal where Next.js is running for errors',
      });
    }

    if (message.includes('Unauthorized') || message.includes('401')) {
      suggestions.push({
        icon: '🔐',
        title: 'Authentication Error',
        description: 'Your session might be expired',
        fixes: [
          'Log out and log back in',
          'Check if cookies are enabled',
          'Verify NEXT_PUBLIC_SUPABASE_URL is set',
        ],
        action: 'Try refreshing the page and logging in again',
      });
    }

    if (message.includes('Prisma') || message.includes('database')) {
      suggestions.push({
        icon: '🗄️',
        title: 'Database Error',
        description: 'Issue with database schema or connection',
        fixes: [
          'Run: npx prisma generate',
          'Run: npx prisma db push',
          'Check Supabase connection string',
        ],
        action: 'Check that DATABASE_URL is set in .env',
      });
    }

    // Generic fallback (removed the !success check)
    if (suggestions.length === 0) {
      suggestions.push({
        icon: '🐛',
        title: 'General Error',
        description: 'Check browser console and server logs',
        fixes: [
          'Open DevTools Console (F12)',
          'Check terminal for server errors',
          'Verify all environment variables are set',
        ],
        action: 'Look for red error messages in terminal and browser console',
      });
    }

    return suggestions;
  }

  // Copy error report to clipboard
  function copyErrorToClipboard(result) {
    const errorReport = `
🧪 3ROTIX TEST ERROR REPORT
═══════════════════════════

Test: ${result.testName}
Time: ${new Date(result.timestamp).toLocaleString()}
Status: ${result.success ? 'PASSED ✅' : 'FAILED ❌'}

Message:
${result.message}

${result.error ? `
Error Details:
${JSON.stringify(result.error, null, 2)}
` : ''}

${result.data ? `
Response Data:
${JSON.stringify(result.data, null, 2)}
` : ''}

${result.suggestions?.length > 0 ? `
Suggested Fixes:
${result.suggestions.map((s, i) => `
${i + 1}. ${s.title}
   ${s.description}
   Fixes:
   ${s.fixes.map(f => `   - ${f}`).join('\n')}
   Action: ${s.action}
`).join('\n')}
` : ''}

Browser: ${navigator.userAgent}
URL: ${window.location.href}
`;

    navigator.clipboard.writeText(errorReport);
    alert('✅ Error report copied to clipboard!');
  }

  // ==================== WALLET TESTS ====================
  async function testWalletBalance() {
    setActiveTest('wallet-balance');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const res = await fetch('/api/wallet', {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got HTML. The API might have crashed. Response: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('wallet-balance', true, `✅ Wallet balance: ${data.lipzBalance} Lipz`, data);
      } else {
        logResult('wallet-balance', false, data.error || 'Failed to fetch wallet', data);
      }
    } catch (err) {
      logResult('wallet-balance', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testAddLipz() {
    setActiveTest('add-lipz');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const amount = parseInt(prompt('Enter Lipz amount to add:') || '1000');

      const res = await fetch('/api/wallet/add-lipz-simulated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('add-lipz', true, `✅ Added ${amount} Lipz! New balance: ${data.newBalance}`, data);
      } else {
        logResult('add-lipz', false, data.error || 'Failed to add Lipz', data);
      }
    } catch (err) {
      logResult('add-lipz', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  // ==================== MESSAGE TESTS ====================
  async function testGetConversations() {
    setActiveTest('get-conversations');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const res = await fetch('/api/messages/conversations', {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('get-conversations', true, `✅ Found ${data.length} conversation(s)`, data);
      } else {
        logResult('get-conversations', false, data.error || 'Failed to get conversations', data);
      }
    } catch (err) {
      logResult('get-conversations', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testCreateConversation() {
    setActiveTest('create-conversation');
    setLoading(true);

    try {
      const userId = prompt('Enter user ID to message:');
      
      if (!userId) {
        logResult('create-conversation', false, 'Cancelled - no user ID provided');
        setLoading(false);
        setActiveTest(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/messages/conversation/${userId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('create-conversation', true, `✅ Conversation created! ID: ${data.id}`, data);
      } else {
        logResult('create-conversation', false, data.error || 'Failed to create conversation', data);
      }
    } catch (err) {
      logResult('create-conversation', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testSendMessage() {
    setActiveTest('send-message');
    setLoading(true);

    try {
      const conversationId = prompt('Enter conversation ID:');
      const message = prompt('Enter message text:');
      
      if (!conversationId || !message) {
        logResult('send-message', false, 'Cancelled or invalid input');
        setLoading(false);
        setActiveTest(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversationId,
          content: message,
        }),
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('send-message', true, '✅ Message sent successfully!', data);
      } else {
        logResult('send-message', false, data.error || 'Failed to send message', data);
      }
    } catch (err) {
      logResult('send-message', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testGetMessages() {
    setActiveTest('get-messages');
    setLoading(true);

    try {
      const conversationId = prompt('Enter conversation ID:');
      
      if (!conversationId) {
        logResult('get-messages', false, 'Cancelled - no conversation ID provided');
        setLoading(false);
        setActiveTest(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/messages/list/${conversationId}`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('get-messages', true, `✅ Found ${data.length} message(s)`, data);
      } else {
        logResult('get-messages', false, data.error || 'Failed to get messages', data);
      }
    } catch (err) {
      logResult('get-messages', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testReaction() {
    setActiveTest('reaction');
    setLoading(true);

    try {
      const messageId = prompt('Enter message ID:');
      const emoji = prompt('Enter emoji (❤️, 👍, 😍, 🔥):');
      
      if (!messageId || !emoji) {
        logResult('reaction', false, 'Cancelled or invalid input');
        setLoading(false);
        setActiveTest(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/messages/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messageId, emoji }),
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('reaction', true, `✅ Added reaction ${emoji}!`, data);
      } else {
        logResult('reaction', false, data.error || 'Failed to add reaction', data);
      }
    } catch (err) {
      logResult('reaction', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testUnlockConversation() {
    setActiveTest('unlock-conversation');
    setLoading(true);

    try {
      const conversationId = prompt('Enter conversation ID to unlock:');
      
      if (!conversationId) {
        logResult('unlock-conversation', false, 'Cancelled');
        setLoading(false);
        setActiveTest(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/messages/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversationId }),
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('unlock-conversation', true, `✅ Unlocked! Spent ${data.lipzSpent} Lipz`, data);
      } else {
        logResult('unlock-conversation', false, data.error || 'Failed to unlock', data);
      }
    } catch (err) {
      logResult('unlock-conversation', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  // ==================== ONBOARDING TESTS ====================
  async function testGetOnboarding() {
    setActiveTest('get-onboarding');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const res = await fetch('/api/onboarding/steps', {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        const completed = data.filter(s => s.completed).length;
        logResult('get-onboarding', true, `✅ ${completed}/${data.length} steps completed`, data);
      } else {
        logResult('get-onboarding', false, data.error || 'Failed to get onboarding', data);
      }
    } catch (err) {
      logResult('get-onboarding', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  async function testEvaluateOnboarding() {
    setActiveTest('evaluate-onboarding');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const res = await fetch('/api/onboarding/evaluate', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 200)}`);
      }

      const data = await res.json();

      if (res.ok) {
        logResult('evaluate-onboarding', true, `✅ ${data.completedCount} steps auto-completed!`, data);
      } else {
        logResult('evaluate-onboarding', false, data.error || 'Failed to evaluate', data);
      }
    } catch (err) {
      logResult('evaluate-onboarding', false, err.message, null, err);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  }

  // ==================== STORAGE TEST ====================
  async function testStorageUpload() {
    setActiveTest('storage-upload');
    setLoading(true);

    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          logResult('storage-upload', false, 'No file selected');
          setLoading(false);
          setActiveTest(null);
          return;
        }

        const fileName = `${user.id}/test-${Date.now()}-${file.name}`;

        const { data, error } = await supabase.storage
          .from('messages')
          .upload(fileName, file);

        if (error) {
          logResult('storage-upload', false, error.message, null, error);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('messages')
            .getPublicUrl(fileName);

          logResult('storage-upload', true, '✅ File uploaded successfully!', { 
            path: data.path, 
            publicUrl 
          });
        }

        setLoading(false);
        setActiveTest(null);
      };

      fileInput.click();
    } catch (err) {
      logResult('storage-upload', false, err.message, null, err);
      setLoading(false);
      setActiveTest(null);
    }
  }

  // ==================== RENDER ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">🔒 Login Required</h1>
          <p className="text-gray-400 mb-6">Please log in to access the test suite</p>
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>3rotix Test Suite 🧪</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🧪 3rotix Test Suite</h1>
            <p className="text-gray-400">
              Test all platform features with one click
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Logged in as: <span className="text-blue-400">{user.email}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Categories */}
            <div className="space-y-6">
              {/* Wallet Tests */}
              <TestCategory
                title="💰 Wallet & Lipz"
                icon="💰"
                tests={[
                  { name: 'Get Wallet Balance', fn: testWalletBalance, key: 'wallet-balance' },
                  { name: 'Add Lipz (Simulated)', fn: testAddLipz, key: 'add-lipz' },
                ]}
                activeTest={activeTest}
                loading={loading}
              />

              {/* Message Tests */}
              <TestCategory
                title="💬 Messages"
                icon="💬"
                tests={[
                  { name: 'Get All Conversations', fn: testGetConversations, key: 'get-conversations' },
                  { name: 'Create Conversation', fn: testCreateConversation, key: 'create-conversation' },
                  { name: 'Send Message', fn: testSendMessage, key: 'send-message' },
                  { name: 'Get Messages', fn: testGetMessages, key: 'get-messages' },
                  { name: 'Add Reaction', fn: testReaction, key: 'reaction' },
                  { name: 'Unlock Conversation', fn: testUnlockConversation, key: 'unlock-conversation' },
                ]}
                activeTest={activeTest}
                loading={loading}
              />

              {/* Onboarding Tests */}
              <TestCategory
                title="✅ Onboarding"
                icon="✅"
                tests={[
                  { name: 'Get Onboarding Steps', fn: testGetOnboarding, key: 'get-onboarding' },
                  { name: 'Auto-Evaluate Steps', fn: testEvaluateOnboarding, key: 'evaluate-onboarding' },
                ]}
                activeTest={activeTest}
                loading={loading}
              />

              {/* Storage Test */}
              <TestCategory
                title="📦 Storage"
                icon="📦"
                tests={[
                  { name: 'Upload Image', fn: testStorageUpload, key: 'storage-upload' },
                ]}
                activeTest={activeTest}
                loading={loading}
              />
            </div>

            {/* Results Panel */}
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">📊 Test Results</h2>
                  {Object.keys(results).length > 0 && (
                    <button
                      onClick={() => setResults({})}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {Object.keys(results).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🧪</div>
                    <p>No tests run yet</p>
                    <p className="text-sm mt-2">Click a test button to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {Object.entries(results)
                      .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
                      .map(([key, result]) => (
                        <EnhancedTestResult
                          key={key}
                          testName={key}
                          result={result}
                          expanded={expandedErrors[key]}
                          onToggleExpand={() => setExpandedErrors(prev => ({
                            ...prev,
                            [key]: !prev[key],
                          }))}
                          onCopy={() => copyErrorToClipboard({ testName: key, ...result })}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TestCategory({ title, icon, tests, activeTest, loading }) {
  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h2>
      <div className="space-y-2">
        {tests.map((test) => (
          <button
            key={test.key}
            onClick={test.fn}
            disabled={loading && activeTest === test.key}
            className={`w-full px-4 py-3 rounded-lg font-bold transition-all text-left ${
              activeTest === test.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && activeTest === test.key ? '⏳ Running...' : `▶ ${test.name}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function EnhancedTestResult({ testName, result, expanded, onToggleExpand, onCopy }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        result.success
          ? 'bg-green-600/10 border-green-600/30'
          : 'bg-red-600/10 border-red-600/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
          {result.success ? '✅' : '❌'} {testName.replace(/-/g, ' ').toUpperCase()}
        </h3>
        <span className="text-xs text-gray-500">
          {new Date(result.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      {/* Message */}
      <p className="text-sm text-gray-300 mb-3">{result.message}</p>
      
      {/* Action Buttons */}
      {!result.success && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onToggleExpand}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold transition-all"
          >
            {expanded ? '🔽 Hide Details' : '🔍 Show Details'}
          </button>
          <button
            onClick={onCopy}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold transition-all"
          >
            📋 Copy Report
          </button>
        </div>
      )}

      {/* Expanded Error Details */}
      {expanded && !result.success && (
        <div className="mt-3 space-y-3">
          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-yellow-400">💡 Suggested Fixes:</h4>
              {result.suggestions.map((suggestion, i) => (
                <div key={i} className="bg-yellow-600/10 border border-yellow-600/30 rounded p-3">
                  <h5 className="text-sm font-bold text-yellow-400 mb-1 flex items-center gap-2">
                    <span>{suggestion.icon}</span>
                    {suggestion.title}
                  </h5>
                  <p className="text-xs text-gray-300 mb-2">{suggestion.description}</p>
                  <ul className="text-xs text-gray-400 space-y-1 mb-2">
                    {suggestion.fixes.map((fix, j) => (
                      <li key={j}>• {fix}</li>
                    ))}
                  </ul>
                  <div className="text-xs bg-black/30 rounded p-2 mt-2">
                    <span className="font-bold text-blue-400">Action:</span> {suggestion.action}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Details */}
          {result.error && (
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 font-bold">
                🐛 View Error Details
              </summary>
              <pre className="mt-2 p-2 bg-black rounded text-xs overflow-x-auto">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </details>
          )}

          {/* Response Data */}
          {result.data && (
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 font-bold">
                📦 View Response Data
              </summary>
              <pre className="mt-2 p-2 bg-black rounded text-xs overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Success Data */}
      {result.success && result.data && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            View Data
          </summary>
          <pre className="mt-2 p-2 bg-black rounded text-xs overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}