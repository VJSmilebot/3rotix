# 3ROTIX Tech Stack & Development Setup

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 13.4.19 | React framework (Pages Router) |
| Prisma | 6.19.1 | ORM for PostgreSQL |
| @prisma/client | 6.19.1 | Prisma runtime client |
| @supabase/ssr | 0.6.1 | Supabase SSR auth |
| @supabase/supabase-js | 2.56.1 | Supabase JavaScript client |
| TailwindCSS | 3.4.17 | CSS framework |

## Package Manager

- **pnpm** is the canonical package manager
- `pnpm-lock.yaml` must be committed
- Use exact version pins for core dependencies

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Required environment variables:

```bash
# Supabase (client + server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Database (runtime - Supavisor session pooler)
DATABASE_URL=postgres://prisma.xxx:password@us-east-1.pooler.supabase.com:5432/postgres

# Database (CLI - direct connection)
DIRECT_URL=postgres://postgres:password@db.xxx.supabase.co:5432/postgres

# Admin (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Feature flags
XP_ENABLED=false  # XP system is OFF for MVP
```

## Database Workflow

**IMPORTANT:** No Prisma migrations allowed.

1. Make schema changes in Supabase Dashboard (SQL Editor)
2. Run: `npx prisma db pull`
3. Run: `npx prisma generate`
4. Changes are reflected in Prisma client

## Key Files to Import From

| Purpose | Canonical Import |
|---------|-----------------|
| Prisma client | `import { prisma } from "lib/prisma.js"` |
| Browser Supabase | `import { getSupabaseClient } from "utils/supabase/client.js"` |
| Server Supabase | `import { createSupabaseServerClient } from "utils/supabase/server.js"` |
| Service role | `import { supabaseAdmin } from "lib/supabaseAdmin.js"` |
| API auth | `import { withAuth } from "lib/auth-middleware.js"` |
| XP award | `import { awardXP } from "lib/xp.js"` |

## Common Patterns

### Creating an API Route
```javascript
import { withAuth } from "../../lib/auth-middleware.js";

export default withAuth(async function handler(req, res) {
  // req.user.id, req.user.role available
  // Use prisma for DB operations
});
```

### Client-Side Auth
```javascript
import { useAuth } from "../context/AuthContext";
const { user, session, signOut } = useAuth();
```

## IDE Setup Recommendations

- VS Code with ESLint + Prettier extensions
- Set `editor.formatOnSave: true`
- Ensure TypeScript/JavaScript language features are enabled

## Testing

- Test files located in `__tests__/` directory
- Run tests with: `pnpm test` (if configured)
