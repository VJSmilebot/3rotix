// /pages/api/user/ensure.js
import { prisma } from "../../../lib/prisma";
import { awardXP } from "../../../lib/xp";
import { randomUUID } from "crypto";   // 👈 add this

// Upserts your public.User row by email (does NOT touch Supabase auth tables)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, name, image, handle } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  try {
    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        image: true,
        rank: true,
        totalXp: true,
      },
    });

    let isNewUser = false;

    if (!existingUser) {
      // Create new user
      existingUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          name: name || null,
          image: image || null,
          handle: handle || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          image: true,
          rank: true,
          totalXp: true,
        },
      });
      isNewUser = true;
    } else {
      // Update existing user
      existingUser = await prisma.user.update({
        where: { email },
        data: {
          name: name || undefined,
          image: image || undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          image: true,
          rank: true,
          totalXp: true,
        },
      });
    }

    // Award XP for profile creation (only for new users)
    if (isNewUser) {
      try {
        await awardXP({
          userId: existingUser.id,
          actionType: "PROFILE_CREATED",
          xpValue: 25,
          refId: existingUser.id,
          idempotencyKey: `profile-created-${existingUser.id}`,
        });
      } catch (xpError) {
        console.warn("XP award failed for profile creation:", xpError.message);
        // Don't fail the user creation if XP fails
      }
    }

    res.status(200).json({ ok: true, user: existingUser });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
}
