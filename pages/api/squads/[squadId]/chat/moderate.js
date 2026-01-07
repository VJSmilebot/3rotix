import { prisma } from '../../../../../lib/prisma';
import { createSupabaseServerClient } from '../../../../../utils/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { squadId } = req.query;
    const { action, messageId, userId, reason, muteUntil, targetUserId, duration } = req.body;

    console.log('🔍 Cookies:', req.cookies); // Debug
    console.log('🔍 Headers:', req.headers.authorization); // Debug

    const supabase = createSupabaseServerClient(req, res);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    console.log('👤 Auth user:', authUser); // Debug
    console.log('❌ Auth error:', authError); // Debug

    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized', details: authError });
    }

    // Get moderator's database user
    const moderator = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    console.log('👤 Moderator found:', moderator?.id); // Debug

    if (!moderator) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get squad to check ownership
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      select: {
        ownerId: true,
        creatorId: true,
      },
    });

    console.log('🏠 Squad owners:', { ownerId: squad.ownerId, creatorId: squad.creatorId, moderatorId: moderator.id }); // Debug

    // Check if user is owner/creator OR moderator
    const isOwner = squad.ownerId === moderator.id || squad.creatorId === moderator.id;
    
    let isModerator = false;
    if (!isOwner) {
      const membership = await prisma.squadMember.findUnique({
        where: {
          squadId_userId: {
            squadId,
            userId: moderator.id,
          },
        },
      });

      console.log('👥 Membership:', membership); // Debug
      isModerator = membership?.role?.toLowerCase().includes('mod');
    }

    console.log('✅ Permissions:', { isOwner, isModerator }); // Debug

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let result;

    switch (action) {
      case 'EDIT_MESSAGE':
        result = await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            content: req.body.content,
            isEdited: true,
            updatedAt: new Date(),
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'EDIT_MESSAGE',
            targetId: messageId,
          },
        });
        break;

      case 'DELETE_MESSAGE':
        result = await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedBy: moderator.id,
            deletedAt: new Date(),
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'DELETE_MESSAGE',
            targetId: messageId,
            reason,
          },
        });
        break;

      case 'PIN_MESSAGE':
        result = await prisma.chatMessage.update({
          where: { id: messageId },
          data: { isPinned: true },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'PIN_MESSAGE',
            targetId: messageId,
          },
        });
        break;

      case 'UNPIN_MESSAGE':
        result = await prisma.chatMessage.update({
          where: { id: messageId },
          data: { isPinned: false },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'UNPIN_MESSAGE',
            targetId: messageId,
          },
        });
        break;

      case 'MUTE_USER':
        const muteEnd = new Date();
        muteEnd.setMinutes(muteEnd.getMinutes() + (duration || 5));

        result = await prisma.squadMute.create({
          data: {
            squadId,
            userId: targetUserId,
            mutedBy: moderator.id,
            reason,
            muteUntil: muteEnd,
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'MUTE_USER',
            targetId: targetUserId,
            reason,
            metadata: { muteUntil: muteEnd, duration },
          },
        });
        break;

      case 'UNMUTE_USER':
        result = await prisma.squadMute.delete({
          where: {
            squadId_userId: {
              squadId,
              userId: targetUserId,
            },
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'UNMUTE_USER',
            targetId: targetUserId,
          },
        });
        break;

      case 'BAN_USER':
        result = await prisma.squadBan.create({
          data: {
            squadId,
            userId: targetUserId,
            bannedBy: moderator.id,
            reason,
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'BAN_USER',
            targetId: targetUserId,
            reason,
          },
        });
        break;

      case 'UNBAN_USER':
        result = await prisma.squadBan.delete({
          where: {
            squadId_userId: {
              squadId,
              userId: targetUserId,
            },
          },
        });

        await prisma.moderatorLog.create({
          data: {
            squadId,
            moderatorId: moderator.id,
            action: 'UNBAN_USER',
            targetId: targetUserId,
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Moderation error:', error);
    return res.status(500).json({ error: error.message });
  }
}