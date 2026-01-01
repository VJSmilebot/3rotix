const { getSquadPerks } = require('./squad-perks');

const ROLE_PERMISSIONS = {
  owner: ['manage_roles', 'manage_members', 'manage_settings', 'manage_challenges'],
  admin: ['manage_members', 'manage_challenges', 'create_events'],
  moderator: ['manage_chat', 'create_events'],
  member: ['participate', 'chat']
};

function canUseFeature(squad, memberId, feature) {
  // Get member's role
  const member = squad.members.find(m => m.userId === memberId);
  if (!member) return false;

  // Check if squad level unlocks feature
  const squadPerks = getSquadPerks(squad.level);
  if (!squadPerks.features.includes(feature)) return false;

  // Check role permissions
  const rolePermissions = ROLE_PERMISSIONS[member.role] || ROLE_PERMISSIONS.member;
  return rolePermissions.includes(feature);
}

module.exports = {
  ROLE_PERMISSIONS,
  canUseFeature
};