const SQUAD_PERKS = {
  1: {
    maxMembers: 10,
    xpBoost: 1.0,
    features: ['chat', 'participate']
  },
  2: {
    maxMembers: 25,
    xpBoost: 1.1,
    features: ['chat', 'participate', 'manage_chat', 'create_events']
  },
  3: {
    maxMembers: 50,
    xpBoost: 1.2,
    features: ['chat', 'participate', 'manage_chat', 'create_events', 'manage_members']
  },
  4: {
    maxMembers: 100,
    xpBoost: 1.3,
    features: ['chat', 'participate', 'manage_chat', 'create_events', 'manage_members', 'manage_challenges']
  },
  5: {
    maxMembers: 250,
    xpBoost: 1.5,
    features: ['chat', 'participate', 'manage_chat', 'create_events', 'manage_members', 'manage_challenges', 'manage_settings']
  }
};

function getSquadPerks(level) {
  return SQUAD_PERKS[level] || SQUAD_PERKS[1];
}

module.exports = {
  SQUAD_PERKS,
  getSquadPerks
};