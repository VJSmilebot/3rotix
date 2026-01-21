// pages/[username].js
import { prisma } from "../lib/prisma";

export async function getServerSideProps(ctx) {
  const raw = ctx.params?.username;
  const username = typeof raw === "string" ? raw.trim() : "";

  if (!username) return { notFound: true };

  // 1) Most important: treat param as handle first
  const user =
    (await prisma.user.findUnique({
      where: { handle: username },
      select: { handle: true },
    })) ||
    // 2) Optional fallback: if you ever used "name" as a username-like thing
    (await prisma.user.findFirst({
      where: { name: username },
      select: { handle: true },
    }));

  if (!user?.handle) return { notFound: true };

  return {
    redirect: {
      destination: `/c/${encodeURIComponent(user.handle)}`,
      permanent: false,
    },
  };
}

export default function UsernameRedirect() {
  return null;
}
