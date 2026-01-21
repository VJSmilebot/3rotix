// pages/u/[handle].jsx
import { prisma } from "../../lib/prisma";

export async function getServerSideProps(ctx) {
  const raw = ctx.params?.handle;
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { notFound: true };

  const user =
    (await prisma.user.findUnique({
      where: { handle: value },
      select: { handle: true },
    })) ||
    (await prisma.user.findFirst({
      where: { name: value },
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

export default function UHandleRedirect() {
  return null;
}
