import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get user from Authorization header or cookie
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

    // Get user from Prisma to check role
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const isCreator = prismaUser?.role === "CREATOR";

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.status(200).json({
      lipzBalance: wallet.lipzBalance,
      creatorEarningsCents: wallet.earningsCents,
      isCreator,
      recentTransactions,
    });
  } catch (err) {
    console.error("Error fetching balances:", err);
    return res.status(500).json({ error: "Failed to fetch balances" });
  }
}
