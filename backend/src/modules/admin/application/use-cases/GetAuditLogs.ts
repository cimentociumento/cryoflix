import type { PrismaClient, Prisma } from '@prisma/client';

export type GetAuditLogsInput = {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export class GetAuditLogsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GetAuditLogsInput) {
    const skip = (input.page - 1) * input.limit;
    const where: Prisma.AuditLogWhereInput = {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.dateFrom || input.dateTo
        ? {
            createdAt: {
              ...(input.dateFrom ? { gte: input.dateFrom } : {}),
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, username: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user?.email,
      username: r.user?.username,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: r.metadata,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
    }));

    return {
      data,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit) || 1,
    };
  }
}
