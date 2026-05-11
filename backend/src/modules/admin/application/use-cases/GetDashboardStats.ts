import type { PrismaClient } from '@prisma/client';
import { AccountStatus, Role } from '@prisma/client';

export type DashboardStatsResult = {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  suspendedOrBanned: number;
  admins: number;
  newUsersToday: number;
  newUsersLast30Days: { date: string; count: number }[];
};

export class GetDashboardStatsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(): Promise<DashboardStatsResult> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    since30.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      pendingVerification,
      suspendedOrBanned,
      admins,
      newUsersToday,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { status: AccountStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.user.count({ where: { status: AccountStatus.PENDING_VERIFICATION } }),
      this.prisma.user.count({
        where: { status: { in: [AccountStatus.SUSPENDED, AccountStatus.BANNED] } },
      }),
      this.prisma.user.count({ where: { role: Role.ADMIN, deletedAt: null } }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfToday }, deletedAt: null },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: since30 }, deletedAt: null },
        select: { createdAt: true },
      }),
    ]);

    const dayMap = new Map<string, number>();
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    const newUsersLast30Days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      newUsersLast30Days.push({ date: key, count: dayMap.get(key) ?? 0 });
    }

    return {
      totalUsers,
      activeUsers,
      pendingVerification,
      suspendedOrBanned,
      admins,
      newUsersToday,
      newUsersLast30Days,
    };
  }
}
