# 3ROTIX Security Guide

## Environment Variables

### ⚠️ CRITICAL: Never commit sensitive environment variables to version control

This repository has been configured to exclude sensitive environment files from git tracking. 

### Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the actual values in `.env.local`:
   - Get Supabase credentials from your Supabase project dashboard
   - Get Livepeer API key from Livepeer Studio
   - Generate secure keys for JWT access control

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (safe for client-side)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `LIVEPEER_API_KEY`: Your Livepeer Studio API key

### Optional Environment Variables

- `ACCESS_CONTROL_PRIVATE_KEY`: Base64 encoded private key for JWT signing
- `NEXT_PUBLIC_ACCESS_CONTROL_PUBLIC_KEY`: Base64 encoded public key for JWT verification
- `NEXTAUTH_URL`: Your application URL for NextAuth
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption

## Security Best Practices

### 1. Environment Management
- Never commit `.env.local` or any file containing secrets
- Use different credentials for development, staging, and production
- Regularly rotate API keys and secrets

### 2. API Security
- All API endpoints include input validation
- Error messages don't expose sensitive information in production
- Rate limiting should be implemented at the infrastructure level

### 3. Database Security
- Use Row Level Security (RLS) policies in Supabase
- Never expose service role keys to client-side code
- Validate all user inputs before database operations

### 4. Frontend Security
- All user inputs are sanitized
- Error boundaries prevent application crashes
- CSP headers should be configured at the server level

## Deployment Security Checklist

- [ ] Environment variables are properly configured in deployment platform
- [ ] No sensitive data in version control
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Database RLS policies are enabled
- [ ] Rate limiting is implemented
- [ ] Error logging is configured (without exposing sensitive data)
- [ ] Regular security audits are scheduled

## Incident Response

If you suspect a security breach:

1. Immediately rotate all API keys and secrets
2. Check application logs for suspicious activity
3. Review database access logs
4. Update any affected users
5. Document the incident and response actions

## Dependencies

Regularly update dependencies to patch security vulnerabilities:

```bash
npm audit
npm audit fix
```

For major version updates that require breaking changes, test thoroughly in a staging environment first.