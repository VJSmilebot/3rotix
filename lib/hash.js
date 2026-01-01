// /lib/hash.js
import crypto from "crypto";

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashIpWithSalt(ip, salt) {
  const safeIp = String(ip || "");
  const safeSalt = String(salt || "");
  return sha256Hex(`${safeIp}${safeSalt}`);
}
