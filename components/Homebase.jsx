import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import io from "socket.io-client";
import { getSupabaseClient } from "../utils/supabase/client";

import { ChatSettings } from "./ChatSettings";
import { MessageModMenu } from "./MessageModMenu";
import { ProfilePeekCard } from "./ProfilePeekCard";
import XpToast from "./XpToast";
import RankUpToast from "./RankUpToast";
import BadgeToast from "./BadgeToast";

// SSR-safe supabase
let supabase = null;
if (typeof window !== "undefined") {
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    // ignore until client env is available
  }
}

const EMPTY_STATS = {
  info: {
    id: null,
    slug: null,
    name: "Squad",
    ownerId: null,
    chat: {
      isOpen: true,
      moderators: [],
      mutedUntil: null,
    },
  },
  levelProgress: {
    current: 1,
    currentXp: 0,
    nextXp: 100,
    xpInLevel: 0,
    xpToNextLevel: 100,
    percent: 0,
  },
  topContributors: [],
  recentAchievements: [],
};

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeStats(raw) {
  // If API returns nothing / wrong shape, give the UI something stable
  if (!raw || typeof raw !== "object") return { ...EMPTY_STATS };

  const info = raw.info || raw || {};
  const chat = (info.chat || raw.chat || {}) ?? {};

  const levelProgress = raw.levelProgress || raw.level || {};
  const currentLevel = Number(levelProgress.current ?? raw.level ?? 1) || 1;

  const currentXp = Number(levelProgress.currentXp ?? levelProgress.xp ?? 0) || 0;
  const nextXp = Number(levelProgress.nextXp ?? levelProgress.next ?? 100) || 100;

  const xpInLevel =
    Number(levelProgress.xpInLevel ?? Math.max(0, currentXp)) || 0;

  const xpToNextLevel =
    Number(levelProgress.xpToNextLevel ?? Math.max(0, nextXp - currentXp)) ||
    Math.max(0, nextXp - currentXp);

  const percentRaw = levelProgress.percent;
  const percent =
    typeof percentRaw === "number"
      ? Math.max(0, Math.min(100, percentRaw))
      : nextXp > 0
        ? Math.max(0, Math.min(100, (Math.max(0, currentXp) / nextXp) * 100))
        : 0;

  const mutedUntil = safeDate(chat.mutedUntil);

  return {
    info: {
      id: info.id ?? raw.id ?? null,
      slug: info.slug ?? raw.slug ?? null,
      name: info.name ?? raw.name ?? "Squad",
      ownerId: info.ownerId ?? raw.ownerId ?? null,
      chat: {
        isOpen: chat.isOpen ?? true,
        moderators: Array.isArray(chat.moderators) ? chat.moderators : [],
        mutedUntil,
      },
    },
    levelProgress: {
      current: currentLevel,
      currentXp,
      nextXp,
      xpInLevel,
      xpToNextLevel,
      percent,
    },
    topContributors: Array.isArray(raw.topContributors)
      ? raw.topContributors
      : Array.isArray(raw.topcontributors)
        ? raw.topcontributors
        : [],
    recentAchievements: Array.isArray(raw.recentAchievements)
      ? raw.recentAchievements
      : Array.isArray(raw.achievements)
        ? raw.achievements
        : [],
  };
}

export default function Homebase({
  squadId,
  currentUser,
  squads,
  onSelectSquad,
}) {
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showCreateJoin, setShowCreateJoin] = useState(false);

  const [showXp, setShowXp] = useState({ amount: 0, action: "" });
  const [showRankUp, setShowRankUp] = useState(null);
  const [showBadge, setShowBadge] = useState(null);

  const [socket, setSocket] = useState(null);
  const [errorBanner, setErrorBanner] = useState("");

  const safeStats = useMemo(() => normalizeStats(stats), [stats]);
  const squadList = Array.isArray(squads) ? squads : [];

  const ownerId = safeStats?.info?.ownerId ?? null;
  const moderators = safeStats?.info?.chat?.moderators ?? [];

  const isLeader = !!currentUser?.id && ownerId === currentUser.id;
  const canModerate =
    isLeader || (!!currentUser?.id && moderators.includes(currentUser.id));

  const isMuted = useMemo(() => {
    const mutedUntil = safeStats?.info?.chat?.mutedUntil;
    if (!mutedUntil) return false;
    return mutedUntil.getTime() > Date.now();
  }, [safeStats]);

  async function authedFetch(url, options = {}) {
    // Many of your /api routes likely expect Authorization: Bearer <token>
    const headers = { ...(options.headers || {}) };

    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore auth header if session fails
    }

    return fetch(url, { ...options, headers });
  }

  async function loadHomebase() {
    if (!squadId) return;

    try {
      setLoading(true);
      setErrorBanner("");

      // IMPORTANT:
      // Your console shows /api/squads/by-slug/<uuid> is 404.
      // That suggests your endpoint expects slug, but you're passing UUID.
      // So we try /api/squads/my (auth) and find by id/slug.
      let squadStatsJson = null;

      // 1) Try /api/squads/my (most reliable if it exists + user is authed)
      const myRes = await authedFetch(`/api/squads/my`);
      if (myRes.ok) {
        const mySquads = await myRes.json();
        if (Array.isArray(mySquads)) {
          squadStatsJson =
            mySquads.find((s) => s?.id === squadId || s?.slug === squadId) ||
            null;
        } else if (mySquads && typeof mySquads === "object") {
          // sometimes API returns { squads: [...] }
          const list = Array.isArray(mySquads.squads) ? mySquads.squads : [];
          squadStatsJson =
            list.find((s) => s?.id === squadId || s?.slug === squadId) || null;
        }
      }

      // 2) Fallback attempt: /api/squads/by-slug/<slug>
      if (!squadStatsJson) {
        const bySlugRes = await authedFetch(`/api/squads/by-slug/${squadId}`);
        if (bySlugRes.ok) squadStatsJson = await bySlugRes.json();
      }

      // 3) chat history
      const chatRes = await authedFetch(`/api/chat/${squadId}`);
      const chatJson = chatRes.ok ? await chatRes.json() : [];

      setStats(normalizeStats(squadStatsJson));
      setMessages(Array.isArray(chatJson) ? chatJson : []);

      if (!myRes.ok && !squadStatsJson) {
        setErrorBanner(
          `Squad stats not loading yet (API mismatch). UI is in safe-mode.`
        );
      }

      if (!chatRes.ok) {
        setErrorBanner((prev) =>
          prev
            ? prev
            : `Chat history failed (${chatRes.status}). Check /api/chat/${squadId}.`
        );
      }
    } catch (err) {
      console.error("Failed to load homebase:", err);
      setStats({ ...EMPTY_STATS });
      setMessages([]);
      setErrorBanner("Failed to load Homebase. Check terminal + Network tab.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squadId]);

  // socket setup
  useEffect(() => {
    if (!supabase || !squadId) return;

    let active = true;
    let s = null;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!active || !session) return;

        s = io({
          auth: { token: session.access_token },
        });

        s.on("connect", () => {
          s.emit("join-squad", squadId);
        });

        s.on("new-message", ({ message, rewards }) => {
          if (!message) return;
          setMessages((prev) => [message, ...prev]);

          const xpGained = rewards?.xp?.total ?? 0;
          if (xpGained > 0) setShowXp({ amount: xpGained, action: "Chat Message" });

          if (rewards?.rankUp) setShowRankUp(rewards.rankUp);
          if (rewards?.badge) setShowBadge(rewards.badge);
        });

        s.on("delete-message", ({ messageId }) => {
          if (!messageId) return;
          setMessages((prev) => prev.filter((m) => m?.id !== messageId));
        });

        s.on("connect_error", (e) => {
          console.warn("socket connect_error:", e?.message || e);
        });

        setSocket(s);
      } catch (e) {
        console.warn("socket setup failed:", e);
      }
    })();

    return () => {
      active = false;
      try {
        if (s) {
          s.emit("leave-squad", squadId);
          s.disconnect();
        }
      } catch (e) {
        // ignore
      }
      setSocket(null);
    };
  }, [squadId]);

  // auth sign-out handling
  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        try {
          socket?.disconnect();
        } catch (e) {}
        setMessages([]);
        setStats(null);
        setErrorBanner("");
      }
    });

    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch (e) {}
    };
  }, [socket]);

  async function hardLogout() {
    setErrorBanner("");
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (e) {
      // if refresh token is already busted, still clear local storage keys
    }

    try {
      if (typeof window !== "undefined") {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.includes("auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) {}

    router.push("/login");
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !squadId) return;

    try {
      setErrorBanner("");

      const res = await authedFetch(`/api/chat/${squadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("sendMessage failed:", res.status, json);
        setErrorBanner(
          `Message failed (${res.status}). Open Network → POST /api/chat/${squadId} → Response.`
        );
        return;
      }

      const msg = json?.message ?? json;
      if (msg) setMessages((prev) => [msg, ...prev]);

      setNewMessage("");

      const xpGained = json?.rewards?.xp?.total ?? 0;
      if (xpGained > 0) setShowXp({ amount: xpGained, action: "Chat Message" });

      if (json?.rewards?.rankUp) setShowRankUp(json.rewards.rankUp);
      if (json?.rewards?.badge) setShowBadge(json.rewards.badge);
    } catch (error) {
      console.error("Failed to send message:", error);
      setErrorBanner("Message failed. Check terminal + Network tab.");
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!messageId) return;

    try {
      await authedFetch(`/api/chat/${squadId}/edit`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      setMessages((prev) => prev.filter((m) => m?.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
      setErrorBanner("Delete failed. Check /api/chat/[squadId]/edit.");
    }
  }

  async function handleMuteUser(userId) {
    if (!userId) return;

    try {
      await authedFetch(`/api/chat/${squadId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mute", userId, duration: 3600 }),
      });
      loadHomebase();
    } catch (error) {
      console.error("Failed to mute user:", error);
      setErrorBanner("Mute failed. Check /api/chat/[squadId]/moderate.");
    }
  }

  const renderMessage = (msg) => {
    const user = msg?.user ?? {};
    const handle = user?.handle ?? "user";
    const image = user?.image || "/default-avatar.png";
    const createdAt = msg?.createdAt ? new Date(msg.createdAt) : null;

    return (
      <div key={msg?.id || `${handle}-${Math.random()}`} className="flex gap-3 group">
        <img
          src={image}
          className="w-9 h-9 rounded-full border border-white/10"
          alt={handle}
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <ProfilePeekCard user={user}>
              <span className="font-semibold cursor-pointer text-white/90 hover:text-white">
                @{handle}
              </span>
            </ProfilePeekCard>
            <span className="text-xs text-white/50">
              {createdAt ? createdAt.toLocaleTimeString() : ""}
            </span>
          </div>
          <p className="text-white/80 whitespace-pre-wrap break-words">
            {msg?.content ?? ""}
          </p>

          <div className="flex gap-3 mt-1 text-xs text-white/40">
            <button className="hover:text-white/70">Reply</button>
            <button className="hover:text-white/70">React</button>
            <button className="opacity-50 cursor-not-allowed">Tip</button>
            <button className="hover:text-white/70">Share</button>
          </div>
        </div>

        {canModerate && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageModMenu
              message={msg}
              onDelete={handleDeleteMessage}
              onMuteUser={handleMuteUser}
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-white/80">
        Loading Homebase…
      </div>
    );
  }

  const meHandle = currentUser?.handle || currentUser?.username || "me";

  return (
    <div className="p-4 lg:p-6">
      {/* Top bar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-white">
            Homebase
            <span className="ml-2 text-white/50 font-normal text-sm">
              {safeStats?.info?.name ? `• ${safeStats.info.name}` : ""}
            </span>
          </div>

          {errorBanner ? (
            <div className="text-xs px-3 py-1 rounded bg-red-500/15 text-red-200 border border-red-500/30">
              {errorBanner}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${meHandle}`}
            className="px-3 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/15 text-sm"
          >
            My Profile
          </Link>

          <Link
            href={`/messages`}
            className="px-3 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/15 text-sm"
          >
            Inbox
          </Link>

          <button
            onClick={hardLogout}
            className="px-3 py-2 rounded-lg bg-pink-600/90 hover:bg-pink-600 text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Squads */}
        <div className="col-span-12 lg:col-span-3">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Squads</h2>
              <Link href="/squads" className="text-xs text-white/50 hover:text-white/80">
                View all
              </Link>
            </div>

            <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
              {squadList.length === 0 ? (
                <div className="text-sm text-white/50">
                  No squads found yet.
                </div>
              ) : (
                squadList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => (onSelectSquad ? onSelectSquad(s.id) : null)}
                    className={`w-full text-left p-3 rounded-lg border transition
                      ${
                        s.id === squadId
                          ? "bg-white/10 border-white/20"
                          : "bg-white/0 border-white/10 hover:bg-white/8 hover:border-white/20"
                      }`}
                  >
                    <div className="text-white/90 font-medium">{s.name || "Squad"}</div>
                    <div className="text-xs text-white/50">
                      {(s.memberCount ?? s.members ?? 0).toLocaleString()} members
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setShowCreateJoin(true)}
              className="mt-4 w-full rounded-lg bg-pink-600/90 hover:bg-pink-600 text-white py-2.5 text-sm font-semibold"
            >
              Create / Join
            </button>
          </div>
        </div>

        {/* Center: Chat */}
        <div className="col-span-12 lg:col-span-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-semibold">Squad Chat</div>
              <div className="text-xs text-white/50">
                {safeStats?.info?.chat?.isOpen ? "Open" : "Closed"}
              </div>
            </div>

            {!safeStats?.info?.chat?.isOpen ? (
              <div className="h-[520px] flex items-center justify-center text-white/50">
                Chat is currently closed by moderators.
              </div>
            ) : (
              <div className="h-[520px] flex flex-col">
                {/* pinned banners */}
                <div className="p-4 space-y-2 border-b border-white/10">
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70">
                    📜 Rules: be respectful, don’t be weird.
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70">
                    🎁 Featured: drops + perks coming soon
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70">
                    🔗 Squad link: <span className="text-white/90">/squads/{safeStats?.info?.slug || squadId}</span>
                  </div>
                </div>

                {/* messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-sm text-white/50">
                      No messages yet. Say something.
                    </div>
                  ) : (
                    messages.map(renderMessage)
                  )}
                </div>

                {/* composer */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isMuted ? "You are muted" : "Send a message…"}
                      disabled={isMuted}
                      className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-pink-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isMuted}
                      className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="col-span-12 lg:col-span-3">
          <div className="space-y-4">
            {/* Squad card */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">Squad</div>
                {isLeader ? (
                  <button
                    onClick={() => setShowSettings((v) => !v)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/80"
                  >
                    Settings
                  </button>
                ) : null}
              </div>

              <div className="mt-3 text-white/80 text-sm">
                <div className="flex items-center justify-between">
                  <span>Level</span>
                  <span className="font-semibold text-white">
                    {safeStats.levelProgress.current}
                  </span>
                </div>

                <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${safeStats.levelProgress.percent}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {safeStats.levelProgress.xpToNextLevel.toLocaleString()} XP to next level
                </div>
              </div>
            </div>

            {showSettings ? (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
                <ChatSettings squadId={squadId} isLeader={isLeader} />
              </div>
            ) : null}

            {/* Top contributors */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
              <div className="text-white font-semibold mb-3">Top Contributors</div>
              {safeStats.topContributors?.length ? (
                <div className="space-y-3">
                  {safeStats.topContributors.map((member) => {
                    const u = member?.user ?? {};
                    return (
                      <div key={member?.id || u?.id || Math.random()} className="flex items-center gap-3">
                        <img
                          src={u?.image || "/default-avatar.png"}
                          className="w-9 h-9 rounded-full border border-white/10"
                          alt={u?.handle || "user"}
                        />
                        <div className="min-w-0">
                          <div className="text-white/90 font-medium truncate">
                            @{u?.handle || "user"}
                          </div>
                          <div className="text-xs text-white/50">
                            {(member?.contributionXp ?? 0).toLocaleString()} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-white/50">No contributors yet.</div>
              )}
            </div>

            {/* Achievements */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
              <div className="text-white font-semibold mb-3">Recent Achievements</div>
              {safeStats.recentAchievements?.length ? (
                <div className="space-y-3">
                  {safeStats.recentAchievements.map((a) => {
                    const ach = a?.achievement ?? a ?? {};
                    return (
                      <div key={a?.id || ach?.id || Math.random()} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                          🏆
                        </div>
                        <div className="min-w-0">
                          <div className="text-white/90 font-medium truncate">
                            {ach?.name || "Achievement"}
                          </div>
                          <div className="text-xs text-white/50">
                            {(ach?.xpReward ?? 0).toLocaleString()} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-white/50">No achievements yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showCreateJoin ? (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold text-lg">Create / Join Squad</div>
                <button
                  onClick={() => setShowCreateJoin(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <button className="w-full rounded-lg bg-pink-600/90 hover:bg-pink-600 text-white py-2.5 font-semibold">
                  Create New Squad
                </button>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60 mb-2">Join with code</div>
                  <input
                    type="text"
                    placeholder="Enter squad code"
                    className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <button className="mt-2 w-full rounded-lg bg-blue-600 text-white py-2 font-semibold">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toasts */}
      <XpToast
        xp={showXp.amount}
        action={showXp.action}
        onClose={() => setShowXp({ amount: 0, action: "" })}
      />

      {showRankUp ? (
        <RankUpToast
          data={showRankUp}
          onClose={() => setShowRankUp(null)}
        />
      ) : null}

      {showBadge ? (
        <BadgeToast
          data={showBadge}
          onClose={() => setShowBadge(null)}
        />
      ) : null}
    </div>
  );
}
