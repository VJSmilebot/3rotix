# 3ROTIX UI + Integration TODO

## Today
- [ ] (pick 1–3 items only)

## This Week
- [ ] 

---

## Phase 0 — Lock the spine
- [ ] Make Homebase default post-login landing (`/homebase`)
- [ ] Enforce one canonical Auth flow
- [ ] Enforce one canonical Prisma client + one canonical Supabase client
- [ ] Enforce XP only via centralized service
- [ ] Enforce Socket.IO security (verify JWT on connect)

## Phase 1 — App Shell
- [ ] Build `AppShell` (Topbar + Nav + RightDrawer)
- [ ] Mobile bottom nav: Homebase / Explore / Drops / Inbox / Me
- [ ] Desktop left nav: same items
- [ ] Add Profile Chip (avatar + level pill)
- [ ] Add Quick Action “+” button (context-aware)

## Phase 2 — Homebase
- [ ] Squad list + Chat panel + Squad info panel
- [ ] Create/Join Squad flow
- [ ] ProfilePeekCard on username in chat
- [ ] Message actions: reply/react/share (tip later)
- [ ] XP toast wired to chat events

## Phase 3 — Inbox
- [ ] `/inbox` tabs: DMs / Mentions / Activity / Rewards
- [ ] Unread filters + mark read
- [ ] Notifications deep-link to exact thread/drop/profile

## Phase 4 — Profiles
- [ ] `/c/[handle]` public profile
- [ ] Profile sections: header/about/featured/drops/offers preview
- [ ] DM button opens thread (not separate “messaging app”)
- [ ] Boundaries block (rules / opt-ins)

## Phase 5 — Drops
- [ ] `/drops` global feed
- [ ] `DropCard` + share to Squad/DM
- [ ] Post types: text / image / clip
