import { useRouter } from "next/router";

export default function CreatorHandlePage() {
  const router = useRouter();
  const handle =
    typeof router.query.handle === "string"
      ? router.query.handle
      : "";

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          {handle ? `@${handle}` : "Creator"}
        </h1>
        <p className="text-white/70">
          Creator profile page (JS-only placeholder).
        </p>
      </header>

      {/* Hero / stream placeholder */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="aspect-video rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white/60">
          Live stream / featured content
        </div>
      </section>

      {/* About */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2">
        <h2 className="text-lg font-semibold text-white">About</h2>
        <p className="text-white/70 text-sm">
          This is a placeholder creator page. Replace this section with
          creator bio, stats, XP, squads, or monetization modules.
        </p>
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-3">
        <button className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-500">
          Follow
        </button>
        <button className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
          Tip
        </button>
      </section>
    </main>
  );
}
