import { Router } from 'express';
import { container } from '../../../../shared/container';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { authorize } from '../../../../shared/infrastructure/middlewares/authorize';
import { logAudit } from '../../../../shared/infrastructure/middlewares/auditLog';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { GetDashboardStatsUseCase } from '../../application/use-cases/GetDashboardStats';
import { ListUsersUseCase } from '../../application/use-cases/ListUsers';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserById';
import { UpdateUserRoleUseCase } from '../../application/use-cases/UpdateUserRole';
import { UpdateUserStatusUseCase } from '../../application/use-cases/UpdateUserStatus';
import { DeleteUserUseCase } from '../../application/use-cases/DeleteUser';
import { GetAuditLogsUseCase } from '../../application/use-cases/GetAuditLogs';
import { AdminDashboardController } from '../controllers/AdminDashboardController';
import { AdminUserController } from '../controllers/AdminUserController';
import { AdminAuditController } from '../controllers/AdminAuditController';

const requireDb = (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  if (!process.env.DATABASE_URL?.trim()) {
    res.status(503).json({ message: 'Painel admin requer DATABASE_URL (PostgreSQL).' });
    return;
  }
  next();
};

const getDashboardStats = new GetDashboardStatsUseCase(container.prisma);
const listUsers = new ListUsersUseCase(container.prisma);
const getUserById = new GetUserByIdUseCase(container.prisma);
const updateUserRole = new UpdateUserRoleUseCase(container.prisma);
const updateUserStatus = new UpdateUserStatusUseCase(container.prisma);
const deleteUser = new DeleteUserUseCase(container.prisma);
const getAuditLogs = new GetAuditLogsUseCase(container.prisma);

const dashboardController = new AdminDashboardController(getDashboardStats);
const userController = new AdminUserController(
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
);
const auditController = new AdminAuditController(getAuditLogs);

export const adminRoutes = Router();

adminRoutes.use(requireDb);
adminRoutes.use(authMiddleware);
adminRoutes.use(authorize('ADMIN'));

adminRoutes.get('/dashboard', safeHandler(dashboardController.dashboard));
adminRoutes.get('/users', safeHandler(userController.list));
adminRoutes.get('/users/:id', safeHandler(userController.getById));
adminRoutes.patch('/users/:id/role', logAudit('ROLE_CHANGE'), safeHandler(userController.patchRole));
adminRoutes.patch('/users/:id/status', logAudit('STATUS_CHANGE'), safeHandler(userController.patchStatus));
adminRoutes.delete('/users/:id', logAudit('USER_DELETE'), safeHandler(userController.remove));
adminRoutes.get('/audit-logs', safeHandler(auditController.list));
