// utils/env.js
// Environment variable validation to ensure all required vars are present

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LIVEPEER_API_KEY',
];

const optionalEnvVars = [
  'ACCESS_CONTROL_PRIVATE_KEY',
  'NEXT_PUBLIC_ACCESS_CONTROL_PUBLIC_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
];

export function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `Warning: Missing optional environment variables: ${warnings.join(', ')}\n` +
      'Some features may not work correctly without these variables.'
    );
  }

  // Validate URL formats
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  } catch (error) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  }

  console.log('✅ Environment variables validated successfully');
}

export function getEnvVar(name, defaultValue = null) {
  const value = process.env[name];
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue;
}