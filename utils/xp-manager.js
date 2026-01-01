// utils/xp-manager.js
// Legacy shim that forwards to the canonical XP engine in lib/xp.js.
// New code should require/import from "lib/xp" directly instead of using this file.

const { awardXP } = require("../lib/xp");

module.exports = {
  awardXP,
};
