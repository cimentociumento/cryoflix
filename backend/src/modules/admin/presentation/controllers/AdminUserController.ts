import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { AccountStatus, Role } from '@prisma/client';
import { ListUsersUseCase } from '../../application/use-cases/ListUsers';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserById';
import { UpdateUserRoleUseCase } from '../../application/use-cases/UpdateUserRole';
import { UpdateUserStatusUseCase } from '../../application/use-cases/UpdateUserStatus';
import { DeleteUserUseCase } from '../../application/use-cases/DeleteUser';

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  search: z.string().optional(),
  orderBy: z.enum(['createdAt', 'email']).optional(),
});

const roleBody = z.object({ role: z.nativeEnum(Role) });
const statusBody = z.object({ status: z.nativeEnum(AccountStatus) });

export class AdminUserController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUserById: GetUserByIdUseCase,
    private readonly updateUserRole: UpdateUserRoleUseCase,
    private readonly updateUserStatus: UpdateUserStatusUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const q = listQuerySchema.parse(req.query);
    const result = await this.listUsers.execute({
      page: q.page,
      limit: q.limit,
      role: q.role,
      status: q.status,
      search: q.search,
      orderBy: q.orderBy,
    });
    res.status(StatusCodes.OK).json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.getUserById.execute(req.params.id);
    res.status(StatusCodes.OK).json(user);
  };

  patchRole = async (req: Request, res: Response): Promise<void> => {
    const body = roleBody.parse(req.body);
    const actorId = req.user!.id;
    const user = await this.updateUserRole.execute(actorId, req.params.id, body.role);
    res.status(StatusCodes.OK).json(user);
  };

  patchStatus = async (req: Request, res: Response): Promise<void> => {
    const body = statusBody.parse(req.body);
    const user = await this.updateUserStatus.execute(req.params.id, body.status);
    res.status(StatusCodes.OK).json(user);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.deleteUser.execute(req.user!.id, req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  };
}
