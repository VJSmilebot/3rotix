// data/taskboard.defaults.js
export const TASKBOARD_STORAGE_KEY = "3rotix_taskboard_v1";
export const TASKBOARD_FILES_DB = "3rotix_taskboard_files_v1";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const DEFAULT_BOARD = {
  version: 1,
  updatedAt: new Date().toISOString(),
  tabs: [
    {
      id: "spine",
      name: "Spine",
      icon: "🧠",
      description: "Stability, auth, security, canonical helpers. Stop regressions.",
      tasks: [
        {
          id: "auth-gating",
          title: "Auth-gate creation APIs",
          status: "doing",
          priority: "P0",
          link: "/homebase",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Lock down images/videos/audio create routes", done: false, link: "/api/images", notes: "" },
            { id: uid("st"), title: "Remove/lock debug endpoints (env/db)", done: false, link: "/api/debug-env", notes: "" },
            { id: uid("st"), title: "Grep for ad-hoc createClient usage; convert to canonical", done: false, link: "/taskboard", notes: "" },
          ],
        },
        {
          id: "canonical-clients",
          title: "Canonical Supabase + Prisma clients everywhere",
          status: "todo",
          priority: "P0",
          link: "/",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Server routes use server client only", done: false, link: "/taskboard", notes: "" },
            { id: uid("st"), title: "Browser uses getSupabaseClient only", done: false, link: "/taskboard", notes: "" },
          ],
        },
        {
          id: "xp-idempotency",
          title: "XP: idempotency + no direct writes",
          status: "todo",
          priority: "P1",
          link: "/admin",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Route awards call lib/xp only", done: false, link: "/taskboard", notes: "" },
            { id: uid("st"), title: "Add stable idempotencyKey per trigger", done: false, link: "/taskboard", notes: "" },
          ],
        },
      ],
      lists: [
        {
          id: "spine-notes",
          title: "Spine Notes / Decisions",
          items: [
            { id: uid("li"), text: "One canonical auth flow. No parallel auth systems.", checked: true, notes: "" },
            { id: uid("li"), text: "No debug endpoints in prod. Ever.", checked: false, notes: "" },
          ],
          notes: "",
        },
      ],
    },

    {
      id: "ux-shell",
      name: "App Shell",
      icon: "🧩",
      description: "Nav, layout, logged-in UX, consistent UI.",
      tasks: [
        {
          id: "navbar-fixes",
          title: "Navbar fixes (logged-in states, dropdown, bigger PFP, fonts)",
          status: "todo",
          priority: "P1",
          link: "/",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Logged-in menu: Inbox / Homebase / Studio / Me", done: false, link: "/homebase", notes: "" },
            { id: uid("st"), title: "Bigger PFP + consistent avatar fallback", done: false, link: "/dashboard", notes: "" },
            { id: uid("st"), title: "Typography pass: 1-2 new fonts + consistent headings", done: false, link: "/legal", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "profiles",
      name: "Profiles",
      icon: "🧬",
      description: "Public profiles, creator portal, role gates.",
      tasks: [
        {
          id: "profile-stability",
          title: "Profile persistence (name/avatar/handle) end-to-end",
          status: "done",
          priority: "P0",
          link: "/creator",
          notes: "If this regresses: check ensure/auth sync logic.",
          subtasks: [
            { id: uid("st"), title: "Save display name persists on refresh", done: true, link: "/creator", notes: "" },
            { id: uid("st"), title: "Avatar persists + storage link stays valid", done: true, link: "/creator", notes: "" },
          ],
        },
        {
          id: "public-profile-polish",
          title: "/c/[handle] polish (tabs, empty states, errors)",
          status: "doing",
          priority: "P1",
          link: "/c/test",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Images tab never throws map errors", done: false, link: "/c/test", notes: "" },
            { id: uid("st"), title: "Audio tab UI & empty state", done: false, link: "/c/test", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "studio",
      name: "Studio",
      icon: "🎛️",
      description: "Creator content tools, upload/edit/watch flow.",
      tasks: [
        {
          id: "studio-buttons",
          title: "Fix Studio Edit / Watch buttons",
          status: "todo",
          priority: "P0",
          link: "/studio",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Edit routes correct per content type", done: false, link: "/studio", notes: "" },
            { id: uid("st"), title: "Watch/Preview works for clips & audio", done: false, link: "/studio", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "homebase",
      name: "Homebase",
      icon: "🏠",
      description: "Your main post-login hub: squads + chat + activity.",
      tasks: [
        {
          id: "homebase-default",
          title: "Make /homebase default post-login landing",
          status: "todo",
          priority: "P0",
          link: "/homebase",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Login redirect always lands here", done: false, link: "/homebase", notes: "" },
            { id: uid("st"), title: "Nav highlights Homebase correctly", done: false, link: "/homebase", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "inbox",
      name: "Inbox",
      icon: "📥",
      description: "Messaging, notifications, quick access from nav.",
      tasks: [
        {
          id: "inbox-menu",
          title: "Add Inbox to hamburger/dropdown everywhere",
          status: "todo",
          priority: "P1",
          link: "/messages",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Nav item visible logged-in", done: false, link: "/messages", notes: "" },
            { id: uid("st"), title: "Unread badge count (optional)", done: false, link: "/messages", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "streaming",
      name: "Streaming",
      icon: "📡",
      description: "Rooms, overlays, chat, paid/private, invites.",
      tasks: [
        {
          id: "overlay-builder",
          title: "Overlay/watermark creator MVP",
          status: "todo",
          priority: "P2",
          link: "/streaming",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "Basic overlay builder UI (text/logo + position)", done: false, link: "/streaming", notes: "" },
            { id: uid("st"), title: "Export OBS browser source URL", done: false, link: "/streaming", notes: "" },
          ],
        },
      ],
      lists: [],
    },

    {
      id: "investor",
      name: "Investor/Compliance",
      icon: "🧾",
      description: "Pitch + 'feds-ready' packet: policies, security, audit trail.",
      tasks: [
        {
          id: "policy-pack",
          title: "Compliance core pack (ToS/Privacy/DMCA/Guidelines/18+)",
          status: "todo",
          priority: "P0",
          link: "/legal",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "DMCA + repeat infringer policy published", done: false, link: "/legal", notes: "" },
            { id: uid("st"), title: "Community Guidelines enforcement ladder + appeals", done: false, link: "/legal/community", notes: "" },
            { id: uid("st"), title: "2257 program plan + recordkeeping SOP (internal)", done: false, link: "/legal", notes: "" },
          ],
        },
        {
          id: "security-readiness",
          title: "Security posture + secrets hygiene + incident plan",
          status: "todo",
          priority: "P0",
          link: "/taskboard?area=spine",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "No debug endpoints, no secrets in client", done: false, link: "/taskboard?area=spine", notes: "" },
            { id: uid("st"), title: "Basic incident response plan doc", done: false, link: "/taskboard", notes: "" },
          ],
        },
        {
          id: "pitch-assets",
          title: "Pitch deck + 1-pager + demo script + risk slide",
          status: "todo",
          priority: "P1",
          link: "/",
          notes: "",
          subtasks: [
            { id: uid("st"), title: "10–12 slide deck draft", done: false, link: "/taskboard", notes: "" },
            { id: uid("st"), title: "1-page executive summary", done: false, link: "/taskboard", notes: "" },
            { id: uid("st"), title: "Demo script (2–3 minutes)", done: false, link: "/taskboard", notes: "" },
          ],
        },
      ],
      lists: [
        {
          id: "investor-notes",
          title: "Investor Notes / Talking Points",
          items: [
            { id: uid("li"), text: "What problem is structurally broken in adult creator platforms?", checked: false, notes: "" },
            { id: uid("li"), text: "How we reduce compliance + payment risk vs competitors", checked: false, notes: "" },
          ],
          notes: "",
        },
      ],
    },
  ],

  // Vault-style docs bucket inside the board (metadata). Actual files stored in IndexedDB.
  docs: [],
};
