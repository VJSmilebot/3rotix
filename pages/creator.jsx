import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSupabaseClient } from "../utils/supabase/client";

function slugHandle(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

export default function CreatorPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [sbUser, setSbUser] = useState(null);
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

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let dead = false;

    async function boot() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      if (!user) {
        router.push("/login");
        return;
      }
      if (dead) return;

      setSbUser(user);

      // Pull canonical Prisma user (id/email/handle/image/etc)
      // Pull canonical Prisma user (source of truth)
try {
  // 1) Get my Prisma user id (and mapping)
  const meRes = await fetch("/api/me");
  const meJson = await meRes.json().catch(() => ({}));
  if (!meRes.ok || !meJson?.user?.id) {
    throw new Error(meJson?.error || "Failed to load /api/me");
  }
  if (dead) return;

  // 2) Fetch full profile using Prisma id
  const prismaUserId = meJson.user.id;
  const r = await fetch(`/api/users/${prismaUserId}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.user) throw new Error(j?.error || "Failed to load user profile");
  if (dead) return;

  setDbUser(j.user);
  setProfile({
    name: j.user.name || "",
    handle: j.user.handle || "",
    bio: j.user.bio || "",
    website: j.user.website || "",
    twitter: j.user.twitter || "",
    instagram: j.user.instagram || "",
    image: j.user.image || "",
    isPublic: j.user.isPublic !== false,
  });
} catch (e) {
  console.error("Failed to load db user:", e);
} finally {
  if (!dead) setLoading(false);
}

    }

    boot();
    return () => {
      dead = true;
    };
  }, [router, supabase]);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !dbUser) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Upload a JPG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${dbUser.id}/${Date.now()}.${ext}`;

      // If existing avatar is in this bucket, try removing it (best-effort)
      if (profile.image?.includes("/storage/v1/object/public/avatars/")) {
        const idx = profile.image.indexOf("/avatars/");
        const oldPath = idx !== -1 ? profile.image.slice(idx + "/avatars/".length) : null;
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
        }
      }

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data?.publicUrl;
      if (!url) throw new Error("Could not get public URL");

      setProfile((p) => ({ ...p, image: url }));
      setSaved(false);
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert(err.message || "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!dbUser) return;

    setSaving(true);
    setSaved(false);

    try {
      const body = {
        name: profile.name.trim() || null,
        handle: slugHandle(profile.handle) || null,
        bio: profile.bio.trim() || null,
        website: profile.website.trim() || null,
        twitter: profile.twitter.trim() || null,
        instagram: profile.instagram.trim() || null,
        image: profile.image || null,
        isPublic: !!profile.isPublic,
      };

      const r = await fetch(`/api/users/${dbUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Save failed");
      
await supabase.auth.updateUser({
  data: {
    full_name: saved.name || undefined,
    name: saved.name || undefined,
    avatar_url: saved.image || undefined,
    picture: saved.image || undefined,
  },
});

      setSaved(true);
      // refresh dbUser copy so redirects use latest handle
      setDbUser((u) => ({ ...u, ...body, handle: body.handle || u.handle }));
    } catch (e) {
      console.error("Save error:", e);
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-200">
        Loading…
      </main>
    );
  }

  const publicHandle = dbUser?.handle || profile.handle;

  return (
    <main className="min-h-screen px-6 py-10 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Creator Portal</h1>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/studio")}
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold hover:bg-pink-700"
            >
              Go to Studio →
            </button>

            {publicHandle ? (
              <button
                onClick={() => router.push(`/c/${publicHandle}`)}
                className="rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold hover:bg-gray-800"
              >
                View Public Profile
              </button>
            ) : null}
          </div>
        </div>

        <section className="rounded-xl border border-gray-800 bg-black/40 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Profile Settings</h2>
            <span className="text-xs text-gray-400">
              Signed in as <span className="text-gray-200">{sbUser?.email}</span>
            </span>
          </div>

          <div className="flex items-center gap-5 mb-6">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-gray-700 bg-gray-900">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-gray-500">
                  No avatar
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-3 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-pink-700">
              {uploadingAvatar ? "Uploading…" : "Change Avatar"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>

            <div className="text-xs text-gray-400">
              JPG/PNG/GIF/WebP • max 2MB
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Name</label>
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                value={profile.name}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, name: e.target.value }));
                  setSaved(false);
                }}
                placeholder="Display name"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Handle</label>
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                value={profile.handle}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, handle: e.target.value }));
                  setSaved(false);
                }}
                placeholder="lipz"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Lowercase letters/numbers/underscore only. Public URL: <span className="text-gray-300">/c/{slugHandle(profile.handle) || "handle"}</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-gray-300 mb-1">Bio</label>
            <textarea
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm min-h-[110px]"
              value={profile.bio}
              onChange={(e) => {
                setProfile((p) => ({ ...p, bio: e.target.value }));
                setSaved(false);
              }}
              placeholder="Tell people who you are…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Website</label>
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                value={profile.website}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, website: e.target.value }));
                  setSaved(false);
                }}
                placeholder="https://…"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Twitter</label>
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                value={profile.twitter}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, twitter: e.target.value }));
                  setSaved(false);
                }}
                placeholder="@…"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Instagram</label>
              <input
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                value={profile.instagram}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, instagram: e.target.value }));
                  setSaved(false);
                }}
                placeholder="@…"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <input
              id="isPublic"
              type="checkbox"
              className="h-4 w-4 accent-pink-500"
              checked={!profile.isPublic}
              onChange={(e) => {
                setProfile((p) => ({ ...p, isPublic: !e.target.checked }));
                setSaved(false);
              }}
            />
            <label htmlFor="isPublic" className="text-sm text-gray-200">
              Hide my profile from public directory
            </label>
          </div>

          <div className="mt-6 sticky bottom-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                saved ? "bg-green-600 hover:bg-green-700" : "bg-pink-600 hover:bg-pink-700"
              } disabled:opacity-50`}
            >
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Profile"}
            </button>

            <p className="mt-2 text-xs text-gray-500 text-center">
              After saving, your public profile is <span className="text-gray-300">/c/{slugHandle(profile.handle) || "handle"}</span>
            </p>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6">
            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
              <div className="font-semibold">Next step</div>
              <p className="text-sm text-gray-300 mt-1">
                Profile looking sharp. Now head to Studio and start uploading content.
              </p>
              <button
                onClick={() => router.push("/studio")}
                className="mt-3 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
              >
                Open Studio →
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
