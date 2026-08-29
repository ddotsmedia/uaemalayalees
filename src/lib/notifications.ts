import { prisma } from '@/lib/db';

export type NotificationType =
  | 'connection_requested'
  | 'connection_accepted'
  | 'post_liked'
  | 'post_commented'
  | 'reply_to_comment'
  | 'user_followed'
  | 'profile_viewed';

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string,
  postId?: string,
  commentId?: string
) {
  try {
    // Deduplicate notifications to avoid spam
    const deduplicationKey = `${recipientId}:${type}:${actorId}:${postId || commentId || ''}`;
    const lastNotification = await prisma.notification.findFirst({
      where: {
        recipientId,
        type,
        actorId,
        postId: postId || undefined,
        commentId: commentId || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate if notification was created in last hour (for reactions/views)
    // But not for connection_requested (should always create)
    if (
      lastNotification &&
      type !== 'connection_requested' &&
      Date.now() - lastNotification.createdAt.getTime() < 3600000
    ) {
      return null; // Skip duplicate
    }

    const notification = await prisma.notification.create({
      data: {
        recipientId,
        type,
        actorId,
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

export async function notifyPostLike(postId: string, likerId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (post && post.authorId !== likerId) {
    return createNotification(post.authorId, 'post_liked', likerId, postId);
  }
}

export async function notifyPostComment(postId: string, commenterId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (post && post.authorId !== commenterId) {
    return createNotification(
      post.authorId,
      'post_commented',
      commenterId,
      postId
    );
  }
}

export async function notifyCommentReply(
  commentId: string,
  replierId: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });

  if (comment && comment.authorId !== replierId) {
    return createNotification(
      comment.authorId,
      'reply_to_comment',
      replierId,
      comment.postId,
      commentId
    );
  }
}

export async function notifyConnectionRequest(
  receiverId: string,
  initiatorId: string
) {
  return createNotification(
    receiverId,
    'connection_requested',
    initiatorId
  );
}

export async function notifyConnectionAccepted(
  receiverId: string,
  acceptorId: string
) {
  return createNotification(
    receiverId,
    'connection_accepted',
    acceptorId
  );
}

export async function notifyUserFollowed(
  followedUserId: string,
  followerId: string
) {
  // Get follower's profile to check if they exist
  const follower = await prisma.personalProfile.findUnique({
    where: { userId: followerId },
    select: { userId: true },
  });

  if (follower) {
    return createNotification(
      followedUserId,
      'user_followed',
      followerId
    );
  }
}

export async function notifyProfileViewed(
  profileOwnerId: string,
  viewerId: string
) {
  // Viewer can be anonymous (null), so skip if no viewerId
  if (viewerId && profileOwnerId !== viewerId) {
    return createNotification(
      profileOwnerId,
      'profile_viewed',
      viewerId
    );
  }
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, read: false },
  });
}
