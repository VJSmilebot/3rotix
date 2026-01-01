// pages/api/vault/list.js
import { prisma } from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔐 Get the current user via Supabase (same pattern as other routes)
  const supabase = createSupabaseServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[vault/list] auth error", authError);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const works = await prisma.registeredWork.findMany({
      where: {
        ownerId: user.id,
        deletedAt: null,
      },
      orderBy: {
        registeredAt: "desc",
      },
      include: {
        media: true,        // Video
        fingerprints: true, // ContentFingerprint[]
      },
    });

    const payload = works.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      status: w.status,
      registeredAt: w.registeredAt,
      isForSale: w.isForSale,
      priceCents: w.priceCents,
      mediaId: w.mediaId,
      video: w.media && {
        id: w.media.id,
        title: w.media.title,
        thumbnailUrl: w.media.thumbnailUrl,
        playbackId: w.media.playbackId,
        visibility: w.media.visibility,
        createdAt: w.media.createdAt,
      },
      fingerprints: w.fingerprints.map((f) => ({
        id: f.id,
        algorithm: f.algorithm,
        value: f.value,
        createdAt: f.createdAt,
      })),
    }));

    return res.status(200).json({ items: payload });
  } catch (err) {
    console.error("[vault/list] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
