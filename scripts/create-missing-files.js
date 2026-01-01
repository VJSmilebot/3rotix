const fs = require('fs');
const path = require('path');

console.log('🔧 Creating missing API files...\n');

// Template for basic API route
const apiTemplate = (description) => `import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * ${description}
 */
export default async function handler(req, res) {
  // Get auth token
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // TODO: Implement logic here
    return res.status(200).json({ 
      message: 'TODO: Implement this endpoint',
      user: user.id 
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
`;

// Files to create
const filesToCreate = [
  {
    path: 'pages/api/wallet/index.js',
    content: apiTemplate('Get or create user wallet'),
    customContent: `import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          lipzBalance: 0,
          usdBalance: 0,
        },
      });
    }

    return res.status(200).json(wallet);
  } catch (err) {
    console.error('Wallet error:', err);
    return res.status(500).json({ error: 'Failed to fetch wallet' });
  }
}
`,
  },
  {
    path: 'pages/api/lipz/buy.js',
    content: apiTemplate('Buy Lipz with Stripe'),
  },
  {
    path: 'pages/api/posts/create.js',
    content: apiTemplate('Create a new post'),
  },
  {
    path: 'pages/api/posts/unlock.js',
    content: apiTemplate('Unlock a paid post'),
  },
  {
    path: 'pages/api/posts/tip.js',
    content: apiTemplate('Tip a post with Lipz'),
  },
  {
    path: 'pages/api/subscriptions/tiers.js',
    content: apiTemplate('Manage subscription tiers'),
  },
  {
    path: 'pages/api/subscriptions/subscribe.js',
    content: apiTemplate('Subscribe to a creator'),
  },
  {
    path: 'pages/api/messages/conversations.js',
    content: apiTemplate('Get all conversations'),
  },
  {
    path: 'pages/api/messages/send.js',
    content: apiTemplate('Send a message'),
  },
  {
    path: 'pages/api/messages/unlock.js',
    content: apiTemplate('Unlock a conversation'),
  },
  {
    path: 'pages/api/messages/react.js',
    content: apiTemplate('React to a message'),
  },
  {
    path: 'pages/api/messages/settings.js',
    content: apiTemplate('Get/Update DM settings'),
  },
];

// Create each file
let created = 0;
let skipped = 0;

for (const file of filesToCreate) {
  const filePath = path.join(process.cwd(), file.path);
  const dir = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, file.customContent || file.content);
    console.log(`✅ Created: ${file.path}`);
    created++;
  } else {
    console.log(`⏭️  Skipped: ${file.path} (already exists)`);
    skipped++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`  ✅ Created: ${created} files`);
console.log(`  ⏭️  Skipped: ${skipped} files`);

if (created > 0) {
  console.log('\n✨ Files created! Now implement the TODO sections in each file.');
  console.log('💡 Tip: Check the previous conversation for full implementations');
}