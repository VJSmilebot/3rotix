// /pages/api/xp/award.js
import { awardXP } from "../../../lib/xp";
import { hashIpWithSalt } from "../../../lib/hash";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// create a global Upstash Redis client + limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// limit: 10 requests / 60 seconds per IP+user
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "xp_award",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";
    const ipHash = hashIpWithSalt(ip, process.env.XP_IP_SALT || "");
    const { userId, actionType, xpValue, refId, idempotencyKey } = req.body || {};

    // 🔒 Rate limit check (unique key = user + ipHash)
    const identifier = `${userId}-${ipHash}`;
    const { success, reset, remaining } = await limiter.limit(identifier);
    if (!success) {
      const secondsLeft = Math.ceil((reset - Date.now()) / 1000);
      return res.status(429).json({
        error: `Rate limit exceeded. Try again in ${secondsLeft}s.`,
        retryAfter: secondsLeft,
      });
    }

    // normal XP awarding
    try {
      const out = await awardXP({
        userId,
        actionType,
        xpValue,
        refId,
        ipHash,
        userAgent,
        idempotencyKey,
      });
      return res.status(200).json({ ...out, remaining });
    } catch (e) {
      const msg = String(e?.message || "");
      const isUnique =
        msg.includes("Unique constraint failed") ||
        msg.includes("duplicate key") ||
        msg.includes("already exists");
      if (idempotencyKey && isUnique) {
        return res.status(200).json({ ok: true, idempotent: true });
      }
      throw e;
    }
  } catch (e) {
    return res.status(400).json({ error: String(e.message || e) });
  }
}
