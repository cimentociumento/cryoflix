import type { PrismaClient, Prisma, Role, AccountStatus } from '@prisma/client';

export type ListUsersInput = {
  page: number;
  limit: number;
  role?: Role;
  status?: AccountStatus;
  search?: string;
  orderBy?: 'createdAt' | 'email';
};

export class ListUsersUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: ListUsersInput) {
    const skip = (input.page - 1) * input.limit;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(input.role ? { role: input.role } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.search
        ? {
            OR: [
              { email: { contains: input.search, mode: 'insensitive' } },
              { username: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderField = input.orderBy === 'email' ? 'email' : 'createdAt';

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { [orderField]: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit) || 1,
    };
  }
}
