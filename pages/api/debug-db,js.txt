// /pages/api/debug-db.js
export default function handler(_req, res) {
  const url = process.env.DATABASE_URL || "";
  try {
    const u = new URL(url);
    // mask password and show host/params
    const safe = `${u.protocol}//${u.username}:***@${u.hostname}:${u.port}${u.pathname}${u.search}`;
    return res.status(200).json({ using: safe });
  } catch {
    return res.status(200).json({ using: "(not set or invalid)" });
  }
}
