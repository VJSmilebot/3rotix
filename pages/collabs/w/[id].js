// pages/collabs/w/[id].js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSupabaseClient } from "../../utils/supabase/client";

function rand(n = 6) {
  return Math.random().toString(16).slice(2, 2 + n);
}

export default function WorkspacePage() {
  const router = useRouter();
  const id = router.query.id; // workspaceId

  const [state, setState] = useState({ loading: true, error: null, workspace: null });
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("shared");

  async function load() {
    if (!id) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await fetch(`/api/collabs/workspaces/${id}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "failed");
      setState({ loading: false, error: null, workspace: j.workspace });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message || "error" }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = getSupabaseClient();
      const ts = Date.now();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const storagePath = `${id}/${folder}/${ts}_${rand(8)}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("collabs")
        .upload(storagePath, file, { upsert: false, contentType: file.type || "application/octet-stream" });

      if (upErr) throw new Error(upErr.message || "upload failed");

      const reg = await fetch("/api/collabs/files/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: id,
          storagePath,
          filename: file.name,
          size: file.size,
          mime: file.type,
        }),
      });

      const jr = await reg.json();
      if (!jr.ok) throw new Error(jr.message || jr.error || "register failed");

      await load();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const ws = state.workspace;
  const proposalId = ws?.proposalId;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={proposalId ? `/collabs/p/${proposalId}` : "/collabs"} className="text-white/60 text-sm hover:text-white">
              ← Back
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Workspace</h1>
            <p className="text-white/60 text-sm">
              Bucket: <span className="text-white">collabs</span> (public)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none text-sm"
            >
              <option value="shared">shared</option>
              <option value="raw">raw</option>
              <option value="edits">edits</option>
              <option value="contracts">contracts</option>
              <option value="references">references</option>
            </select>

            <label className={`px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm cursor-pointer ${uploading ? "opacity-60" : ""}`}>
              {uploading ? "Uploading…" : "Upload File"}
              <input type="file" className="hidden" onChange={onPickFile} disabled={uploading} />
            </label>
          </div>
        </div>

        {state.error && <div className="mt-6 text-red-400">Error: {state.error}</div>}
        {state.loading && <div className="mt-6 text-white/60">Loading…</div>}

        {!state.loading && ws && (
          <div className="mt-6 border border-white/10 rounded-2xl p-5 bg-white/5">
            <div className="font-semibold">Files</div>

            <div className="mt-4 grid gap-2">
              {ws.files?.map((f) => {
                // build public URL client-side; we don't store URL in DB
                const supabase = getSupabaseClient();
                const { data } = supabase.storage.from("collabs").getPublicUrl(f.storagePath);
                const url = data?.publicUrl || "#";

                return (
                  <a
                    key={f.id}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40"
                  >
                    <div className="text-sm">{f.filename}</div>
                    <div className="text-xs text-white/50">
                      {f.mime || "file"} {f.size ? `• ${Math.round(f.size / 1024)} KB` : ""} • @{f.uploadedBy?.handle || "?"}
                    </div>
                  </a>
                );
              })}

              {!ws.files?.length && <div className="text-white/60">No files uploaded yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}