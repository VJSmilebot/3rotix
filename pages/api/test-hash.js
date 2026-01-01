// /pages/api/test-hash.js
import { hashIpWithSalt } from "../../lib/hash";

export default async function handler(req, res) {
  // pretend this is the user's IP
  const fakeIp = "123.45.67.89";
      // read your secret salt from .env
  const salt = process.env.XP_IP_SALT || "";

  // hash it using the helper
  const hashed = hashIpWithSalt(fakeIp, salt);

  res.status(200).json({
    fakeIp,
    saltPreview: salt.slice(0, 8) + "...",
    hashedResult: hashed,
    hashLength: hashed.length,
  });
}
