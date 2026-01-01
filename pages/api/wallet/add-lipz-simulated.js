import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies["sb-access-token"];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - no token" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("Auth error:", authError);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          lipzBalance: 0,
          earningsCents: 0,
        },
      });
    }

    // Update wallet and create transaction
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          lipzBalance: {
            increment: amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "LOAD_LIPZ_SIMULATED",
          lipzAmount: amount,
          amountCents: 0,
          platformFeeCents: 0,
          creatorNetCents: 0,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      lipzBalance: updatedWallet.lipzBalance,
      transaction,
    });
  } catch (err) {
    console.error("Error adding Lipz:", err);
    return res.status(500).json({ error: "Failed to add Lipz" });
  }
}
