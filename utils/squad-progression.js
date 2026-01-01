const SQUAD_LEVEL_XP = {
  1: 0,
  2: 1000,
  3: 2500,
  4: 5000,
  5: 10000,
  // Add more levels as needed
};

function calculateSquadLevel(totalXp) {
  let level = 1;
  for (const [lvl, xpRequired] of Object.entries(SQUAD_LEVEL_XP)) {
    if (totalXp >= xpRequired) {
      level = parseInt(lvl);
    } else {
      break;
    }
  }
  return level;
}

function getNextLevelXp(currentLevel) {
  const nextLevel = currentLevel + 1;
  return SQUAD_LEVEL_XP[nextLevel] || null;
}

module.exports = {
  calculateSquadLevel,
  getNextLevelXp,
  SQUAD_LEVEL_XP
};