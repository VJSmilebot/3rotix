Socket.IO rules:

- Socket connections must include Supabase JWT
- JWT must be verified server-side
- Server sets socket.userId
- Client-provided userId is ignored
