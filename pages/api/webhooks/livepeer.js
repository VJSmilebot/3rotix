// pages/api/webhooks/livepeer.js

export default async function handler(req, res) {
  // Livepeer webhooks are POST-only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    // TODO (later, optional but recommended):
    // - Verify Livepeer signature headers if you enable signing
    // - Validate event.type before acting
    // - If you award XP, do it ONLY via centralized XP utilities
    //   (utils/xp.js, utils/chat-tracker.js, etc.)

    // For now: acknowledge receipt so Livepeer doesn't retry
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Livepeer webhook error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
