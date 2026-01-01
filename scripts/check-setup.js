const fs = require('fs');
const path = require('path');

console.log('🔍 Checking 3rotix Setup...\n');

const checks = {
  passed: [],
  failed: [],
  warnings: [],
};

// Files that should exist
const requiredFiles = {
  'API Routes': [
    'pages/api/wallet/index.js',
    'pages/api/lipz/buy.js',
    'pages/api/posts/create.js',
    'pages/api/posts/unlock.js',
    'pages/api/posts/tip.js',
    'pages/api/subscriptions/tiers.js',
    'pages/api/subscriptions/subscribe.js',
    'pages/api/messages/conversations.js',
    'pages/api/messages/conversation/[conversationId].js',
    'pages/api/messages/send.js',
    'pages/api/messages/unlock.js',
    'pages/api/messages/react.js',
    'pages/api/messages/list/[conversationId].js',
    'pages/api/messages/settings.js',
  ],
  'Pages': [
    'pages/messages/index.js',
    'pages/messages/[conversationId].js',
    'pages/settings/dm.js',
  ],
  'Components': [
    'components/VoiceRecorder.js',
    'components/MediaPreview.js',
  ],
  'Utils': [
    'utils/uploadMedia.js',
  ],
};

// Check each file
for (const [category, files] of Object.entries(requiredFiles)) {
  console.log(`📁 ${category}:`);
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
      checks.passed.push(file);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      checks.failed.push(file);
    }
  }
  console.log('');
}

// Check environment variables
console.log('🔐 Environment Variables:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
];

for (const envVar of envVars) {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar}`);
  } else {
    console.log(`  ⚠️  ${envVar} - NOT SET`);
    checks.warnings.push(envVar);
  }
}
console.log('');

// Summary
console.log('📊 Summary:');
console.log(`  ✅ Passed: ${checks.passed.length}`);
console.log(`  ❌ Failed: ${checks.failed.length}`);
console.log(`  ⚠️  Warnings: ${checks.warnings.length}`);
console.log('');

if (checks.failed.length > 0) {
  console.log('❌ SETUP INCOMPLETE!');
  console.log('Missing files:');
  checks.failed.forEach(f => console.log(`  - ${f}`));
  console.log('\n💡 Run: node scripts/create-missing-files.js');
  process.exit(1);
} else if (checks.warnings.length > 0) {
  console.log('⚠️  Setup complete but warnings exist');
  console.log('Check your .env.local file');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED!');
  process.exit(0);
}