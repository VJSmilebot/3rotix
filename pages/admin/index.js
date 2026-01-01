import React, { useEffect, useState } from "react";
import { getSupabaseClient } from "../../utils/supabase/client";

export default function Admin() {
  const [token, setToken] = useState("");
  useEffect(() => setToken(localStorage.getItem("ADMIN_PANEL_TOKEN") || ""), []);
  const saveToken = (v) => { localStorage.setItem("ADMIN_PANEL_TOKEN", v); setToken(v); };

  async function authFetch(url, body) {
  // get Supabase access token for the logged-in user
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const jwt = data?.session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    "x-admin-token": token,                 // from your input on the page
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || res.statusText);
  return json;
}


  const [emailOrHandle, setEmail] = useState("");
  const [actionType, setAction] = useState("ADMIN_GRANT");
  const [xpValue, setXp] = useState(25);

  const [bio, setBio] = useState(""); const [linksJson, setLinks] = useState("");
  const [isPerf, setPerf] = useState(false); const [accepted, setAccepted] = useState(false);

  const [owner, setOwner] = useState(""); const [title, setTitle] = useState("Filler Post");
  const [type, setType] = useState("VIDEO"); const [status, setStatus] = useState("READY");
  const [storageUrl, setStorage] = useState(""); const [playback, setPlayback] = useState("");
  const [streamId, setStreamId] = useState(""); const [thumb, setThumb] = useState("");

  const [squadOwner, setSO] = useState(""); const [squadName, setSN] = useState("Neon Sirens"); const [squadSlug, setSS] = useState("neon-sirens");
  const [badgeTarget, setBT] = useState(""); const [badgeType, setBTy] = useState("FOUNDING_FAN");
  const [log, setLog] = useState([]); const push = (s)=>setLog(l=>[`• ${s}`,...l].slice(0,40));

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">Admin Console (JS)</h1>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Admin Token</div>
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10" value={token} onChange={e=>saveToken(e.target.value)} placeholder="Paste ADMIN_PANEL_TOKEN" />
          <button className="px-3 py-2 rounded bg-white/10" onClick={()=>saveToken("")}>Clear</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Award XP</div>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="email or handle" value={emailOrHandle} onChange={e=>setEmail(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="actionType" value={actionType} onChange={e=>setAction(e.target.value)} />
          <input type="number" className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="xp" value={xpValue} onChange={e=>setXp(Number(e.target.value))} />
          <button className="px-3 py-2 rounded bg-pink-500" onClick={async()=>{ const r=await authFetch("/api/admin/award-xp",{emailOrHandle,actionType,xpValue}); push(`award → ${JSON.stringify(r)}`); }}>Award</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Profile Upsert</div>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="email or handle" value={emailOrHandle} onChange={e=>setEmail(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder='linksJson e.g. {"x":"…"}' value={linksJson} onChange={e=>setLinks(e.target.value)} />
          <textarea rows={3} className="md:col-span-2 px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="bio" value={bio} onChange={e=>setBio(e.target.value)} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={isPerf} onChange={e=>setPerf(e.target.checked)} /> Performer</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} /> Mark consent accepted</label>
          <button className="md:col-span-2 px-3 py-2 rounded bg-pink-500" onClick={async()=>{ const r=await authFetch("/api/admin/profile-upsert",{emailOrHandle,bio,linksJson,isPerformer:isPerf,markAccepted:accepted}); push(`profile → ${JSON.stringify(r)}`); }}>Save</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Create Content</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="owner email/handle" value={owner} onChange={e=>setOwner(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10" value={type} onChange={e=>setType(e.target.value)}>
              <option>VIDEO</option><option>IMAGE</option><option>STREAM</option>
            </select>
            <select className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10" value={status} onChange={e=>setStatus(e.target.value)}>
              <option>READY</option><option>DRAFT</option><option>LIVE</option>
            </select>
          </div>
          <input className="md:col-span-3 px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="storageUrl" value={storageUrl} onChange={e=>setStorage(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="livepeerPlaybackId" value={playback} onChange={e=>setPlayback(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="livepeerStreamId" value={streamId} onChange={e=>setStreamId(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="thumbnailUrl" value={thumb} onChange={e=>setThumb(e.target.value)} />
          <button className="md:col-span-3 px-3 py-2 rounded bg-pink-500" onClick={async()=>{ const r=await authFetch("/api/admin/content-create",{ownerEmailOrHandle:owner,title,type,status,storageUrl,livepeerPlaybackId:playback,livepeerStreamId:streamId,thumbnailUrl:thumb}); push(`content → ${JSON.stringify(r)}`); }}>Create</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Create Squad</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="owner email/handle" value={squadOwner} onChange={e=>setSO(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="name" value={squadName} onChange={e=>setSN(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="slug" value={squadSlug} onChange={e=>setSS(e.target.value)} />
          <button className="md:col-span-3 px-3 py-2 rounded bg-pink-500" onClick={async()=>{ const r=await authFetch("/api/admin/squad-create",{ownerEmailOrHandle:squadOwner,name:squadName,slug:squadSlug}); push(`squad → ${JSON.stringify(r)}`); }}>Create Squad</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Issue Badge</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="email or handle" value={badgeTarget} onChange={e=>setBT(e.target.value)} />
          <input className="px-3 py-2 rounded bg-black/40 border border-white/10" placeholder="type (string)" value={badgeType} onChange={e=>setBTy(e.target.value)} />
          <button className="px-3 py-2 rounded bg-pink-500" onClick={async()=>{ const r=await authFetch("/api/admin/badge-issue",{emailOrHandle:badgeTarget,type:badgeType}); push(`badge → ${JSON.stringify(r)}`); }}>Issue</button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="font-semibold mb-2">Activity (latest)</div>
        <div className="space-y-1 text-sm text-white/80">{log.map((l,i)=><div key={i}>{l}</div>)}</div>
      </section>
    </main>
  );
}
