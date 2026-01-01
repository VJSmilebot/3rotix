Authentication rules:

- Supabase Auth is the ONLY auth system
- NextAuth is forbidden
- Do not add next-auth packages or helpers
- Do not use getServerSession or authOptions
- Server must derive identity from Supabase JWT only
