// scripts/test-chat-xp.js
// Node script to test trackChatActivity in a safe, standalone way.

const { prisma } = require("../lib/prisma");
const { trackChatActivity } = require("../utils/chat-tracker");

async function main() {
  console.log("Looking up a test user...");

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.error("No users found in database.");
    process.exit(1);
  }

  console.log("\nUsing user:", user);

  console.log("\nDEBUG: Calling trackChatActivity with messageCount=1, no messageText");

  const result = await trackChatActivity({
    userId: user.id,
    messageCount: 1,
    messageText: "this is a test message " + Date.now(),
  });

  console.log("\nRaw result from trackChatActivity:");
  console.dir(result, { depth: null });

  // Fetch updated user + last logs
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const recentLogs = await prisma.xPLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\nUser after chat XP:");
  console.log(updatedUser);

  console.log("\nRecent XP logs:");
  console.log(recentLogs);
}

main()
  .catch((err) => {
    console.error("Error in test-chat-xp:", err);
  })
  .finally(() => {
    process.exit();
  });
