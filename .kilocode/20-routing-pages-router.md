# Routing Rules (Pages Router Only)

## Next.js router
- This repo uses Next.js Pages Router.
- Forbidden: App Router migration, `app/` directory patterns, or mixed routing systems.

## API routes
- All APIs must live under: `pages/api/*`
- Forbidden: non-pages/api server endpoints or random server folders pretending to be APIs.

## Route param consistency
- Standardize param naming (example: squadId vs squadid) and update callers.
- Do not introduce new param styles without updating all usages.

## Rendering sanity
- Every page must have a default export.
- No blank pages due to missing exports or crashing imports.
