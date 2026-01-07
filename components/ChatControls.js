'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChatControls({ playbackId }) {
  const { supabase, ready } = useAuth() || {};
  if (!ready || !supabase) return null;
  
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('public');      // public | squad | squadvip
  const [slow, setSlow] = useState(0);
  const [pinned, setPinned] = useState('');
  const chRef = useRef(null);

  // Load saved room state
  useEffect(() => {
    if (!playbackId) return;
    (async () => {
      const { data: room } = await supabase.from('chat_rooms').select('*').eq('playback_id', playbackId).maybeSingle();
      if (room) {
        setEnabled(!!room.enabled);
        setMode(room.mode || 'public');
        setSlow(room.slow || 0);
        setPinned(room.pinned || '');
      }
    })();
  }, [playbackId]);

  // Realtime channel
  useEffect(() => {
    if (!playbackId) return;
    const ch = supabase.channel(`chat:${playbackId}`);
    ch.subscribe();
    chRef.current = ch;
    return () => { try { ch.unsubscribe(); } catch {} };
  }, [playbackId]);

  async function pushSettings(next = {}) {
    const payload = { enabled, mode, slow, pinned, ...next };
    await chRef.current?.send({ type: 'broadcast', event: 'settings', payload });
    // persist
    await supabase.from('chat_rooms').upsert({
      playback_id: playbackId,
      enabled: payload.enabled, mode: payload.mode, slow: payload.slow, pinned: payload.pinned,
      updated_at: new Date().toISOString(),
    });
  }

  async function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    pushSettings({ enabled: next });
  }

  async function setModeAndPush(v) {
    setMode(v); pushSettings({ mode: v });
  }

  async function setSlowAndPush(v) {
    const val = Number(v);
    setSlow(val); pushSettings({ slow: val });
  }

  async function pinMessage() {
    const text = window.prompt('Pin message:');
    if (text == null) return;
    setPinned(text);
    await chRef.current?.send({ type: 'broadcast', event: 'pin', payload: { text } });
    pushSettings({ pinned: text });
  }

  async function clearChat() {
    if (!window.confirm('Clear chat for all viewers?')) return;
    await chRef.current?.send({ type: 'broadcast', event: 'clear' });
    // no DB deletion (we keep VOD history). Add a delete policy later if needed.
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Chat</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-pink-600" checked={enabled} onChange={toggleEnabled} />
          Enable
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-white/80">Mode
          <select
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2"
            value={mode}
            onChange={(e)=>setModeAndPush(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="squad">Squad</option>
            <option value="squadvip">SquadVIP</option>
          </select>
        </label>

        <label className="text-sm text-white/80">Slow mode
          <select
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2"
            value={slow}
            onChange={(e)=>setSlowAndPush(e.target.value)}
          >
            <option value="0">Off</option>
            <option value="3">3s</option>
            <option value="10">10s</option>
            <option value="30">30s</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={pinMessage} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm">Pin</button>
        <button onClick={clearChat} className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 text-sm">Clear</button>
      </div>

      <p className="text-xs text-white/50">
        Viewers subscribe to <code className="px-1 bg-black/40 rounded">chat:{playbackId || '...'}</code>.
        Settings are broadcast in realtime and saved for late joiners.
      </p>
    </div>
  );
}
