import { Redis } from "@upstash/redis";
export default async function handler(_req, res) {
  try {
    const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const t = Date.now().toString();
    await r.set("ping", t);
    const v = await r.get("ping");
    res.status(200).json({ ok: true, value: v });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
