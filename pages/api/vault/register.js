// pages/api/vault/register.js
import { prisma } from "../../../lib/prisma";
import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { hashLivepeerAsset } from "../../../lib/fingerprints";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔐 Get current user from Supabase
  const supabase = createSupabaseServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[vault/register] auth error", authError);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const {
      mediaId,
      title,
      description,
      isForSale,
      priceCents,
      officialLinks,
      allowedPlatforms,
    } = req.body || {};

    // ✅ Only need mediaId + title here
    if (!mediaId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1) Make sure this Video belongs to the user
    const media = await prisma.video.findFirst({
      where: {
        id: mediaId,
        userId: user.id, // your Video model uses userId
      },
    });

    if (!media) {
      return res
        .status(404)
        .json({ error: "Media not found or not owned by user" });
    }

    if (!media.assetId) {
  return res.status(400).json({
    error: "This video has no Livepeer assetId configured",
  });
}

// 2) Prefer pre-computed fingerprint, fallback to Livepeer hashing
    let hashHex = media.fingerprintSha256;

    if (!hashHex) {
     // No stored hash yet → compute once and cache it
      hashHex = await hashLivepeerAsset(media.assetId);

    await prisma.video.update({
      where: { id: media.id },
      data: { fingerprintSha256: hashHex },
  });
}

    // 3) Check if this hash is already registered for this user
    const existing = await prisma.contentFingerprint.findFirst({
      where: {
        algorithm: "SHA256_FILE",
        value: hashHex,
        registeredWork: {
          ownerId: user.id,
          deletedAt: null,
        },
      },
      include: {
        registeredWork: true,
      },
    });

    if (existing) {
      return res.status(409).json({
        error:
          "This video (or an identical copy) is already registered in your vault.",
        registeredWorkId: existing.registeredWork.id,
      });
    }

    // 4) Create RegisteredWork + ContentFingerprint + RegisteredWorkAsset
    const registeredWork = await prisma.$transaction(async (tx) => {
      const rw = await tx.registeredWork.create({
        data: {
          ownerId: user.id,
          title,
          description: description || null,
          mediaId: media.id,
          isForSale: !!isForSale,
          priceCents: isForSale ? priceCents ?? null : null,
          officialLinks: officialLinks || undefined,
          allowedPlatforms: allowedPlatforms || undefined,
        },
      });

      await tx.contentFingerprint.create({
        data: {
          registeredWorkId: rw.id,
          algorithm: "SHA256_FILE",
          value: hashHex,
        },
      });

      await tx.registeredWorkAsset.create({
        data: {
          registeredWorkId: rw.id,
          mediaId: media.id,
        },
      });

      return rw;
    });

    return res.status(201).json({ registeredWork });
  } catch (err) {
    console.error("[vault/register] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
