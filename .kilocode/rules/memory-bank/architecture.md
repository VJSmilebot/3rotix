# 3ROTIX Architecture

## Canonical Stack

| Package | Version | Placement |
|---------|---------|-----------|
| next | 13.4.19 | dependencies |
| @prisma/client | 6.19.1 | dependencies |
| prisma | 6.19.1 | devDependencies |
| @supabase/ssr | 0.6.1 | dependencies |
| @supabase/supabase-js | 2.56.1 | dependencies |

## Directory Structure

```
3rotixp/
├── lib/                           # Server-only utilities
│   ├── prisma.js                  # Prisma singleton (ONLY import source)
│   ├── auth.js                    # Server auth helpers (getSupabaseUser, requireAuth, requireAdmin)
│   ├── auth-middleware.js         # withAuth wrapper for API routes
│   ├── supabaseAdmin.js           # Service role client (server-only)
│   └── xp.js                      # XP awarding (canonical, idempotent)
├── utils/
│   └── supabase/
│       ├── client.js              # Browser Supabase client (getSupabaseClient)
│       └── server.js              # Server Supabase client (createSupabaseServerClient)
├── context/
│   └── AuthContext.js             # React auth context (consumer only)
├── middleware.js                  # Session proxy using updateSession()
├── prisma/
│   └── schema.prisma              # Public schema only (no auth schema)
└── pages/
    ├── _app.js                    # Wraps with AuthProvider
    └── api/                       # All API routes use withAuth wrapper
```

## Auth Flow

1. **Browser:** Supabase Auth via `@supabase/ssr`, cookies managed by `AuthProvider`
2. **Middleware:** `updateSession()` proxy for page routes (Edge-safe, no Prisma)
3. **API Routes:** `withAuth()` wrapper from `lib/auth-middleware.js` (Node.js, Prisma allowed)
4. **Authorization:** `public.User.role` from Prisma (NOT from JWT claims)

## Database Connection

- `DATABASE_URL`: Supavisor session pooler (5432) for runtime
- `DIRECT_URL`: Direct connection for CLI (db pull, generate)
- Schema: PUBLIC only, no auth schema tables

## Key Patterns

### Prisma Singleton
```javascript
// lib/prisma.js
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### API Route Auth
```javascript
// pages/api/example.js
import { withAuth } from "../../lib/auth-middleware.js";
export default withAuth(async function handler(req, res) {
  // req.user is available
});
```

### XP Awarding
```javascript
// lib/xp.js
import { awardXP } from "../../lib/xp.js";
await awardXP({
  userId, actionType, xpValue, idempotencyKey: "stable-unique-key"
});
```

## Forbidden Patterns

- ❌ NextAuth
- ❌ Multiple PrismaClient instances
- ❌ Ad-hoc Supabase clients
- ❌ Direct XPLog.create() outside lib/xp.js
- ❌ Prisma migrations
- ❌ Service role in browser
