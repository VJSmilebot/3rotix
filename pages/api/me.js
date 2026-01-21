// pages/api/me.js
import { withAuth } from "../../lib/auth-middleware";

export default withAuth(async function handler(req, res) {
  // req.user is Prisma user (includes supabaseId)
  return res.status(200).json({
    ok: true,
    user: {
      id: req.user.id, // Prisma id
      supabaseId: req.user.supabaseId,
      email: req.user.email,
      role: req.user.role,
      handle: req.user.handle,
    },
  });
});
