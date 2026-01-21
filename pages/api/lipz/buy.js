import { prisma } from "../../../lib/prisma";
import { withAuth } from "../../../lib/auth-middleware";

/**
 * Buy Lipz (payment rail TBD)
 * Rule: 1 Lipz = 1 cent (internal accounting)
 */
export default withAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = req.user.id;
  const { amount } = req.body || {};

  const lipzAmount = Number(amount);
  if (!Number.isInteger(lipzAmount) || lipzAmount <= 0) {
    return res.status(400).json({ ok: false, error: "Valid amount required" });
  }

  try {
    // Placeholder: no external processor yet.
    // When Stripe is added: charge amountCents = lipzAmount (NOT lipzAmount * 100)
    return res.status(200).json({
      ok: true,
      data: {
        message: "TODO: Implement Stripe integration",
        userId,
        lipzAmount,
        amountCents: lipzAmount, // 1 Lipz = 1 cent
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
