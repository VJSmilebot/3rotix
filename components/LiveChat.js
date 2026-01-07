'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from "../context/AuthContext";

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}

function Badge({ children, tone = 'default' }) {
  const cls =
    tone === 'creator'
      ? 'bg-pink-600/20 border-pink-600/40 text-pink-300'
      : tone === 'mod'
      ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-300'
      : tone === 'vip'
      ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
      : 'bg-white/5 border-white/10 text-white/70';

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  );
}

export default function LiveChat({ playbackId, viewerRole = 'viewer', className = '' }) {
  const auth = useAuth() ?? {};
  const user = auth.user ?? null;
  const supabase = auth.supabase ?? null;
  const ready = !!auth.ready;

  // ✅ Hooks must always run
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState({ enabled: false, mode: 'public', slow: 0, pinned: '' });
  const [lockedFor, setLockedFor] = useState(0);

  const scrollRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const chanRef = useRef(null);

  const supaReady = ready && !!supabase;

  const canSpeak = useMemo(() => {
    if (!settings.enabled) return false;
    if (settings.mode === 'public') return true;
    if (settings.mode === 'squad') return ['vip', 'mod', 'creator', 'squad'].includes(viewerRole);
    if (settings.mode === 'squadvip') return ['vip', 'mod', 'creator'].includes(viewerRole);
    return false;
  }, [settings.enabled, settings.mode, viewerRole]);

  // Load baseline state + history
  useEffect(() => {
    let mounted = true;
    if (!supaReady || !playbackId) return;

    (async () => {
      const [{ data: room }, { data: rows }] = await Promise.all([
        supabase.from('chat_rooms').select('*').eq('playback_id', playbackId).maybeSingle(),
        supabase
          .from('chat_messages')
          .select('*')
          .eq('playback_id', playbackId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
          .limit(200),
      ]);

      if (!mounted) return;

      if (room) {
        setSettings({
          enabled: !!room.enabled,
          mode: room.mode || 'public',
          slow: room.slow || 0,
          pinned: room.pinned || '',
        });
      } else {
        setSettings((s) => ({ ...s, enabled: false }));
      }

      setMessages(rows || []);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 999999 }));
    })();

    return () => {
      mounted = false;
    };
  }, [supaReady, playbackId, supabase]);

  // Realtime wiring
  useEffect(() => {
    if (!supaReady || !playbackId) return;

    const ch = supabase.channel(`chat:${playbackId}`);
    chanRef.current = ch;

    ch.on('broadcast', { event: 'settings' }, (p) => {
      const s = p?.payload || {};
      setSettings((prev) => ({ ...prev, ...s }));
    });

    ch.on('broadcast', { event: 'clear' }, () => setMessages([]));
    ch.on('broadcast', { event: 'pin' }, (p) =>
      setSettings((prev) => ({ ...prev, pinned: p?.payload?.text || '' }))
    );

    ch.on('broadcast', { event: 'msg' }, (p) => {
      const m = p?.payload;
      if (!m) return;

      setMessages((arr) => [...arr, m]);

      const el = scrollRef.current;
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
        requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight }));
      }
    });

    ch.subscribe();

    return () => {
      try { ch.unsubscribe(); } catch {}
    };
  }, [supaReady, playbackId, supabase]);

  // slow-mode countdown
  useEffect(() => {
    if (!lockedFor) return;
    const id = setInterval(() => setLockedFor((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [lockedFor]);

  async function send() {
    const text = input.trim();
    if (!text || sending || !playbackId) return;
    if (!canSpeak) return;

    const now = Date.now();
    if (settings.slow > 0 && now - lastSentAtRef.current < settings.slow * 1000) {
      const rem = Math.ceil((settings.slow * 1000 - (now - lastSentAtRef.current)) / 1000);
      setLockedFor(rem);
      return;
    }

    setSending(true);
    try {
      const handle =
        user?.user_metadata?.handle ||
        user?.email?.split('@')?.[0] ||
        (typeof localStorage !== 'undefined'
          ? (localStorage.getItem('guest_handle') ||
              (() => {
                const h = 'guest-' + Math.random().toString(36).slice(2, 6);
                localStorage.setItem('guest_handle', h);
                return h;
              })())
          : 'guest');

      const role = viewerRole || 'viewer';

      const temp = {
        id: uuid(),
        playback_id: playbackId,
        user_id: user?.id || null,
        handle,
        role,
        text,
        created_at: new Date().toISOString(),
      };

      setMessages((arr) => [...arr, temp]);
      setInput('');
      lastSentAtRef.current = now;
      if (settings.slow > 0) setLockedFor(settings.slow);

      const res = await fetch('/api/livechat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbackId, handle, role, text }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages((arr) => arr.map((m) => (m.id === temp.id ? message : m)));
      } else {
        setMessages((arr) => arr.filter((m) => m.id !== temp.id));
      }
    } finally {
      setSending(false);
    }
  }

  // ✅ If auth/supabase not ready, render a tiny placeholder (or return null)
  if (!supaReady) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60 ${className}`}>
        Loading chat…
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur ${className}`}>
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="font-semibold">Chat</div>
        {!settings.enabled && <span className="text-xs text-white/60">Disabled</span>}
      </div>

      {settings.pinned ? (
        <div className="px-4 py-2 text-sm border-b border-white/10 bg-white/5">
          <span className="mr-2"><Badge tone="creator">Pinned</Badge></span>
          <span className="text-white/80">{settings.pinned}</span>
        </div>
      ) : null}

      <div ref={scrollRef} className="h-72 md:h-[28rem] overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-white/50 text-sm mt-8">No messages yet.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm leading-snug">
            <span className="mr-2 text-white/80 font-medium">{m.handle}</span>
            {m.role !== 'viewer' && <span className="mr-2"><Badge tone={m.role}>{m.role}</Badge></span>}
            <span className="text-white/90">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500"
            placeholder={
              !settings.enabled
                ? 'Chat is disabled by streamer'
                : canSpeak
                ? (settings.slow > 0 && lockedFor > 0 ? `Slow mode: wait ${lockedFor}s` : 'Say something nice…')
                : (settings.mode === 'squad' ? 'Squad-only chat' : 'SquadVIP-only chat')
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            disabled={!settings.enabled || !canSpeak || (settings.slow > 0 && lockedFor > 0)}
            aria-label="Type a chat message"
          />
          <button
            onClick={send}
            disabled={!settings.enabled || !canSpeak || sending || !input.trim() || (settings.slow > 0 && lockedFor > 0)}
            className="rounded-lg px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>

        <div className="text-[11px] text-white/50 mt-1">
          {settings.enabled ? (
            <>Mode: <b>{settings.mode}</b>{settings.slow ? ` • Slow: ${settings.slow}s` : ''}</>
          ) : (
            'Chat disabled by streamer'
          )}
        </div>
      </div>
    </div>
  );
}
