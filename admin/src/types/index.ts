export type Role = 'USER' | 'ADMIN';
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  suspendedOrBanned: number;
  admins: number;
  newUsersToday: number;
  newUsersLast30Days: { date: string; count: number }[];
}

export interface BlockedMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  reason?: string | null;
  createdAt: string;
  blockedBy?: { id: string; username: string; email: string } | null;
}

export interface MovieSearchResult {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  username?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
