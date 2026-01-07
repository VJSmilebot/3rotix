# Supabase Clients + Secrets Safety

## Client vs server keys
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be used in browser code or exposed to bundles.
- Service role client is server-only: `lib/supabaseAdmin.js`

## Canonical usage
- Browser: use `utils/supabase/client.js`
- Server/API/SSR: use `utils/supabase/server.js`
- Do not instantiate Supabase clients inside random API handlers.

## Logging / leakage
- Never log raw access tokens, refresh tokens, cookies, or service keys.
- If debugging auth: redact tokens and secrets.
