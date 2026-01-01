// pages/api/tips/send.js
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

  // Get token from Authorization header or cookie (same as your other APIs)
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

  const { creatorId, amount, message } = req.body || {};

  if (!creatorId || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid tip payload" });
  }

  if (creatorId === user.id) {
    return res.status(400).json({ error: "You can’t tip yourself" });
  }

  try {
    // Get sender wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.lipzBalance < amount) {
      return res.status(400).json({ error: "Not enough Lipz" });
    }

    // Optional: platform settings (fallback 10%)
    let platformCutPercent = 10;
    try {
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "default" },
      });
      if (settings?.globalPlatformCutPercent != null) {
        platformCutPercent = settings.globalPlatformCutPercent;
      }
    } catch (e) {
      console.warn("PlatformSettings lookup failed, using default 10%", e);
    }

    const creatorLipz = Math.floor(amount * (1 - platformCutPercent / 100));
    const platformLipz = amount - creatorLipz;

    // Run all updates in a transaction
    const [updatedSenderWallet, createdTip, createdTx] =
      await prisma.$transaction([
        // 1) deduct Lipz from sender
        prisma.wallet.update({
          where: { userId: user.id },
          data: {
            lipzBalance: {
              decrement: amount,
            },
          },
        }),

        // 2) create Tip row
        prisma.tip.create({
          data: {
            fromUserId: user.id,
            toUserId: creatorId,
            lipzAmount: amount,
            message: message || null,
          },
        }),

        // 3) create Transaction row
        prisma.transaction.create({
          data: {
            userId: user.id,
            creatorId: creatorId,
            type: "TIP",
            lipzAmount: amount,
            amountCents: 0,
            platformFeeCents: platformLipz,
            creatorNetCents: creatorLipz,
          },
        }),
      ]);

    // 4) add creator earnings separately (upsert wallet if missing)
    await prisma.wallet.upsert({
      where: { userId: creatorId },
      update: {
        earningsCents: {
          // temp: 1 Lipz = 1 cent; we can change this later using settings
          increment: creatorLipz,
        },
      },
      create: {
        userId: creatorId,
        lipzBalance: 0,
        earningsCents: creatorLipz,
        currency: "USD",
      },
    });

    return res.status(200).json({
      success: true,
      lipzBalance: updatedSenderWallet.lipzBalance,
      tip: createdTip,
      transaction: createdTx,
    });
  } catch (err) {
    console.error("Tip error:", err);
    return res.status(500).json({ error: "Failed to send tip" });
  }
}
