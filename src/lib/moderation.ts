import { prisma } from '@/lib/db';

export async function checkAndAutoSuspend(
  targetId: string,
  targetType: 'profile' | 'business'
): Promise<boolean> {
  const AUTO_SUSPEND_THRESHOLD = 5;

  // Count reports
  const reportCount = await prisma.report.count({
    where:
      targetType === 'profile'
        ? { targetPersonalProfileId: targetId }
        : { targetBusinessPageId: targetId },
  });

  // Auto-suspend if threshold reached
  if (reportCount >= AUTO_SUSPEND_THRESHOLD) {
    if (targetType === 'profile') {
      await prisma.personalProfile.update({
        where: { userId: targetId },
        data: { active: false },
      });
    } else {
      await prisma.businessPage.update({
        where: { id: targetId },
        data: { active: false },
      });
    }

    return true;
  }

  return false;
}

export async function getReportStats(targetId: string, targetType: string) {
  const reports = await prisma.report.findMany({
    where:
      targetType === 'profile'
        ? { targetPersonalProfileId: targetId }
        : { targetBusinessPageId: targetId },
    select: {
      reason: true,
      status: true,
      createdAt: true,
    },
  });

  const stats = {
    total: reports.length,
    byReason: {
      FAKE_PROFILE: 0,
      SPAM: 0,
      INAPPROPRIATE: 0,
      OTHER: 0,
    },
    byStatus: {
      NEW: 0,
      REVIEWING: 0,
      ACTIONED: 0,
      DISMISSED: 0,
    },
    recentReports: reports
      .filter(
        r =>
          new Date(r.createdAt).getTime() >
          Date.now() - 30 * 24 * 60 * 60 * 1000
      )
      .length,
  };

  reports.forEach(r => {
    if (r.reason in stats.byReason) {
      stats.byReason[r.reason as keyof typeof stats.byReason]++;
    }
    if (r.status in stats.byStatus) {
      stats.byStatus[r.status as keyof typeof stats.byStatus]++;
    }
  });

  return stats;
}
