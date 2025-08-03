// gamificationOverview.js

export const gamificationOverview = {
  levels: [100, 250, 500, 900, 1500, 2200],
  xpSources: [
    { action: "Sign Up", xp: 50 },
    { action: "Complete Profile", xp: 50 },
    { action: "Referral Signup", xp: 100 },
    { action: "Upload Clip", xp: 100 }
  ],
  earlyRanks: [
    { title: "Trailblazer", criteria: "First 100 users" },
    { title: "Day One", criteria: "Joined first 48 hrs" }
  ],
  missions: [
    { title: "Hype Drop", reward: "100 XP" },
    { title: "Upload Fire", reward: "150 XP" },
    { title: "Ambassador", reward: "Badge + 250 XP" }
  ],
  badges: [
    "Verified Viber", "Hustler", "Vibe Curator", "OG Supporter"
  ],
  referrals: {
    tiers: [3, 5, 10, 25],
    rewards: ["Badge", "Feature Token", "Beta Access", "Whitelist"]
  },
  seasonal: true,
  tokenPlanned: true
};
