// pages/api/upscale.js
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp"; // 👈 Added sharp for alpha + background handling

// Allow uploads up to 25MB
export const config = {
  api: {
    bodyParser: { sizeLimit: "25mb" },
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, model, scale, faceEnhance, background } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });

    const apiKey = process.env.RUNPOD_API_KEY;
    const endpointId = process.env.RUNPOD_ENDPOINT_ID;

    // Build payload dynamically
    const payload = {
      input: {
        source_image: imageBase64,
        model: model || "RealESRGAN_x4plus",
        scale: scale || 2,
        face_enhance: faceEnhance ?? false,
      },
    };

    const runpodUrl = `https://api.runpod.ai/v2/${endpointId}/run`;
    const response = await fetch(runpodUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const job = await response.json();
    if (!job.id) return res.status(500).json({ error: "Failed to start job", job });

    // Poll until done
    const statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${job.id}`;
    let status = "IN_PROGRESS";
    let result = null;

    while (status === "IN_PROGRESS" || status === "IN_QUEUE") {
      const pollResp = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const pollData = await pollResp.json();
      status = pollData.status;

      if (status === "COMPLETED") result = pollData.output;
      if (status === "FAILED") return res.status(500).json({ error: "Upscale failed", pollData });

      if (!result) await new Promise((r) => setTimeout(r, 4000));
    }

    if (!result?.image) return res.status(500).json({ error: "No output image received" });

    // Convert base64 → buffer
    let buffer = Buffer.from(result.image, "base64");

    // Use sharp to handle transparency / background if needed
    if (background === "transparent") {
      // Try to preserve alpha: extract original alpha from input
      const origBuffer = Buffer.from(imageBase64, "base64");
      const origSharp = sharp(origBuffer).ensureAlpha();
      const { data: origMeta } = await origSharp.metadata();

      // Resize alpha mask to match upscaled size
      const alphaMask = await origSharp
        .extractChannel("alpha")
        .resize({ width: origMeta.width * (scale || 2) })
        .toBuffer();

      buffer = await sharp(buffer).joinChannel(alphaMask).png().toBuffer();
    } else if (background === "white" || background === "black") {
      const color = background === "white" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
      buffer = await sharp(buffer).flatten({ background: color }).png().toBuffer();
    }

    // Upload to Supabase
    const fileName = `upscaled-${Date.now()}.png`;
    const { error } = await supabase.storage.from("upscaler").upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) return res.status(500).json({ error: "Supabase upload failed", details: error.message });

    const { data: publicUrlData } = supabase.storage.from("upscaler").getPublicUrl(fileName);

    res.status(200).json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Upscale API error:", err);
    res.status(500).json({ error: "Unexpected failure", details: err.message });
  }
}
