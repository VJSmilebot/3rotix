// pages/creator-portal.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSupabaseClient } from "../utils/supabase/client";

export default function CreatorPortal() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [session, setSession] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    handle: "",
    bio: "",
    website: "",
    twitter: "",
    instagram: "",
    image: "",
    isPublic: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data?.session || null;
        if (!s) {
          router.push("/login");
          return;
        }
        if (!alive) return;
        setSession(s);

        // Ensure Prisma user exists (your app has this route)
        await fetch("/api/user/ensure", {
          method: "POST",
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).catch(() => {});

        // Prefer authed overview endpoint if it returns a user; otherwise fallback to by-email
        let userObj = null;

        const tryOverview = await fetch("/api/user/overview", {
          headers: { Authorization: `Bearer ${s.access_token}` },
        }).catch(() => null);

        if (tryOverview?.ok) {
          const json = await tryOverview.json().catch(() => null);
          userObj = json?.user || json?.data?.user || json?.data || json;
        }

        if (!userObj?.id) {
          // fallback
          const email = s.user?.email || "";
          const r = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
          const j = await r.json().catch(() => ({}));
          userObj = j;
        }

        if (!alive) return;

        setDbUser(userObj);
        setProfile({
          name: userObj?.name || "",
          handle: userObj?.handle || "",
          bio: userObj?.bio || "",
          website: userObj?.website || "",
          twitter: userObj?.twitter || "",
          instagram: userObj?.instagram || "",
          image: userObj?.image || "",
          isPublic: userObj?.isPublic !== false,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  async function savePatch(patch) {
    if (!dbUser?.id) throw new Error("Missing user");

    // Get fresh session instead of relying on state
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    
    if (!token) throw new Error("Missing session token");

    const res = await fetch(`/api/users/${dbUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || "Save failed");

    const u = json?.user || json;
    setDbUser(u);
    return u;
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const patch = {
        name: profile.name,
        handle: profile.handle,
        bio: profile.bio,
        website: profile.website,
        twitter: profile.twitter,
        instagram: profile.instagram,
        image: profile.image,
        isPublic: profile.isPublic,
      };

      const u = await savePatch(patch);

      setProfile((p) => ({
        ...p,
        name: u?.name || "",
        handle: u?.handle || "",
        bio: u?.bio || "",
        website: u?.website || "",
        twitter: u?.twitter || "",
        instagram: u?.instagram || "",
        image: u?.image || "",
        isPublic: u?.isPublic !== false,
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !dbUser?.id) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Upload JPG, PNG, GIF, or WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
      const fileName = `${Date.now()}.${safeExt}`;
      const filePath = `${dbUser.id}/${fileName}`;

      // delete old avatar file (best-effort)
      if (profile.image?.includes("/storage/v1/object/public/avatars/")) {
        const prefix = "/storage/v1/object/public/avatars/";
        const idx = profile.image.indexOf(prefix);
        if (idx !== -1) {
          const oldPath = profile.image.slice(idx + prefix.length);
          await supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
        }
      }

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("No public URL returned");

      // update UI immediately
      setProfile((p) => ({ ...p, image: publicUrl }));

      // persist immediately so it "sticks"
      await savePatch({ image: publicUrl });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert(err.message || "Avatar upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-upload same file
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-10 text-gray-100">
        Loading…
      </main>
    );
  }

  if (!dbUser) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-10 text-gray-100">
        <h1 className="text-2xl font-semibold">Creator Portal</h1>
        <p className="mt-2 text-gray-300">Couldn’t load your profile.</p>
        <button
          className="mt-4 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium hover:bg-pink-700"
          onClick={() => router.push("/login")}
        >
          Go to login
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 text-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-3"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Creator Portal</h1>
          <p className="text-gray-400 mt-1">
            Edit your public profile ( /c/{profile.handle || "handle"} )
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/c/${profile.handle || ""}`)}
            className="rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm hover:bg-black/50"
            disabled={!profile.handle}
            title={!profile.handle ? "Set your handle first" : ""}
          >
            View public profile
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold hover:bg-pink-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved ✅" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="mt-8 bg-[#0f0f0f] border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-black border border-gray-800 grid place-items-center">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-xs">No photo</span>
            )}
          </div>

          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer text-sm font-semibold">
              {uploading ? "Uploading…" : "Change Avatar"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <div className="text-xs text-gray-500 mt-2">
              JPG/PNG/GIF/WebP • max 2MB • uploads to Supabase Storage
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-300 mb-1">Name</div>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600"
              placeholder="Display name"
            />
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-1">Handle</div>
            <input
              value={profile.handle}
              onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value }))}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600"
              placeholder="username (no spaces)"
            />
            <div className="text-xs text-gray-500 mt-1">
              This becomes your URL: /c/handle
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-sm text-gray-300 mb-1">Bio</div>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600 resize-none"
              placeholder="Tell people who you are…"
            />
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-1">Website</div>
            <input
              value={profile.website}
              onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600"
              placeholder="https://…"
            />
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-1">Twitter</div>
            <input
              value={profile.twitter}
              onChange={(e) => setProfile((p) => ({ ...p, twitter: e.target.value }))}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600"
              placeholder="@name"
            />
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-1">Instagram</div>
            <input
              value={profile.instagram}
              onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg outline-none focus:border-pink-600"
              placeholder="@name"
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              checked={!profile.isPublic}
              onChange={(e) =>
                setProfile((p) => ({ ...p, isPublic: !e.target.checked }))
              }
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-200">
              Hide my profile from public directory
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
