// lib/fingerprints.js
// @ts-nocheck

import crypto from "crypto";

/**
 * Stream a URL and compute SHA-256 for its content.
 */
async function hashUrlSha256(url) {
  const res = await fetch(url);

  if (!res.ok) {
    console.error("[hashUrlSha256] download error:", res.status, res.statusText);
    throw new Error(`Failed to download asset for hashing (status ${res.status})`);
  }

  if (!res.body) {
    throw new Error("No response body when downloading asset");
  }

  const hash = crypto.createHash("sha256");
  const reader = res.body.getReader();

  // Stream through the body and feed into hash
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    hash.update(Buffer.from(value));
  }

  return hash.digest("hex");
}

/**
 * Get a stable hash for a Livepeer asset using the Livepeer Studio API.
 * 1) Fetch the asset by assetId.
 * 2) If Livepeer exposes a hash, use it.
 * 3) Otherwise, fall back to hashing the asset's downloadUrl ourselves.
 */
export async function hashLivepeerAsset(assetId) {
  if (!process.env.LIVEPEER_API_KEY) {
    throw new Error("LIVEPEER_API_KEY is not set in environment");
  }

  const res = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[hashLivepeerAsset] Livepeer asset error:", data);
    throw new Error("Failed to fetch asset from Livepeer");
  }

  const phase = data.status && data.status.phase;
  const hashField = data.hash ?? null;

  console.log(
    "[hashLivepeerAsset] asset response (trimmed):",
    JSON.stringify(
      {
        id: data.id,
        playbackId: data.playbackId,
        status: data.status,
        hasDownloadUrl: !!data.downloadUrl,
        hashFieldType: hashField && typeof hashField,
        hashField: hashField,
      },
      null,
      2
    )
  );

  // ---------- 1) If Livepeer does provide a hash, use it ----------
  let hashes = [];

  if (Array.isArray(hashField)) {
    hashes = hashField;
  } else if (hashField && typeof hashField === "object") {
    hashes = [hashField];
  } else if (typeof hashField === "string") {
    return hashField; // simplest case
  }

  if (hashes.length > 0) {
    const sha =
      hashes.find(
        (h) =>
          h.algorithm &&
          h.algorithm.toString().toLowerCase().includes("sha256")
      ) || hashes[0];

    if (sha && sha.hash) {
      return sha.hash;
    }
  }

  // ---------- 2) Fallback: hash the downloadUrl ourselves ----------
  if (data.downloadUrl) {
    console.log("[hashLivepeerAsset] No hash field; hashing downloadUrl instead");
    const hex = await hashUrlSha256(data.downloadUrl);
    console.log("[hashLivepeerAsset] computed SHA-256:", hex);
    return hex;
  }

  // If we ever land here, the asset has no hash AND no downloadUrl → we bail.
  throw new Error(
    `No sha256 hash or downloadUrl found for Livepeer asset (status phase: ${phase || "unknown"})`
  );
}
