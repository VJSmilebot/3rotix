import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../../lib/prisma";

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
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID required" });
  }

  try {
    const event = await prisma.eventTicket.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event.isActive) {
      return res.status(400).json({ error: "Event is not available" });
    }

    if (event.status === "ENDED" || event.status === "CANCELLED") {
      return res
        .status(400)
        .json({ error: "Event has ended or been cancelled" });
    }

    if (event.creatorId === user.id) {
      return res
        .status(400)
        .json({ error: "You can't purchase your own event ticket" });
    }

    const existingPurchase = await prisma.eventTicketPurchase.findUnique({
      where: {
        eventTicketId_userId: {
          eventTicketId: eventId,
          userId: user.id,
        },
      },
    });

    if (existingPurchase) {
      return res
        .status(400)
        .json({ error: "You already have a ticket for this event" });
    }

    if (event.totalTickets && event.soldTickets >= event.totalTickets) {
      return res.status(400).json({ error: "Event is sold out" });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { globalplatformcutpercent: true },
    });

    const lipzAmount = Number(event.price);
    const feePercent = Number(settings?.globalplatformcutpercent ?? 10);
    const platformFeeCents = Math.floor((lipzAmount * feePercent) / 100);
    const creatorNetCents = lipzAmount - platformFeeCents;

    const result = await prisma.$transaction(async (tx) => {
      // Create purchase record (unique constraint protects duplicates)
      const purchase = await tx.eventTicketPurchase.create({
        data: {
          eventTicketId: eventId,
          userId: user.id,
          lipzPaid: lipzAmount,
        },
      });

      // Race-safe debit
      const dec = await tx.wallet.updateMany({
        where: { userId: user.id, lipzBalance: { gte: lipzAmount } },
        data: { lipzBalance: { decrement: lipzAmount } },
      });

      if (dec.count !== 1) throw new Error("INSUFFICIENT_LIPZ");

      const updatedCreatorWallet = await tx.wallet.upsert({
        where: { userId: event.creatorId },
        create: {
          userId: event.creatorId,
          lipzBalance: 0,
          earningsCents: creatorNetCents,
          currency: "USD",
        },
        update: {
          earningsCents: { increment: creatorNetCents },
        },
      });

      const updatedEvent = await tx.eventTicket.update({
        where: { id: eventId },
        data: {
          soldTickets: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          creatorId: event.creatorId,
          type: "EVENT_TICKET",
          lipzAmount,
          amountCents: lipzAmount, // 1 Lipz = 1 cent
          platformFeeCents,
          creatorNetCents,
          metadata: {
            eventTicketId: eventId,
            eventTitle: event.title,
            eventDate: event.eventDate,
          },
        },
      });

      const updatedBuyerWallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      return { purchase, updatedBuyerWallet, updatedCreatorWallet, updatedEvent };
    });

    return res.status(200).json({
      success: true,
      purchase: result.purchase,
      newBalance: result.updatedBuyerWallet?.lipzBalance ?? 0,
      event: result.updatedEvent,
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_LIPZ") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      return res.status(400).json({
        error: "Insufficient Lipz balance",
        required: event?.price,
        current: wallet?.lipzBalance ?? 0,
      });
    }

    console.error("Error purchasing ticket:", err);
    return res.status(500).json({ error: "Failed to purchase ticket" });
  }
}
