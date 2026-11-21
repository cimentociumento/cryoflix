import { test as base, expect } from '@playwright/test';

const adminOrigin = 'http://127.0.0.1:5184';
const targetUserId = 'user-presentation';
type Role = 'USER' | 'ADMIN';

const targetUser = () => ({
  id: targetUserId,
  email: 'ana@example.test',
  username: 'ana',
  displayName: 'Ana Silva',
  avatarUrl: null,
  bio: null,
  role: 'USER' as Role,
  status: 'ACTIVE',
  emailVerified: true,
  lastLoginAt: '2026-11-20T12:00:00.000Z',
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-20T12:00:00.000Z',
});

type AdminMock = {
  roleRequests: Role[];
  statusRequests: string[];
  rejectRoleChange: boolean;
  missingUser: boolean;
  deleted: boolean;
  detailRequests: number;
  documentRequests: string[];
};

const test = base.extend<{ adminMock: AdminMock }>({
  adminMock: async ({ page }, use) => {
    const user = targetUser();
    const state: AdminMock = {
      roleRequests: [],
      statusRequests: [],
      rejectRoleChange: false,
      missingUser: false,
      deleted: false,
      detailRequests: 0,
      documentRequests: [],
    };
    const pageErrors: string[] = [];
    const unexpectedRequests: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        state.documentRequests.push(request.url());
      }
    });

    // Persist only the token, as the real store does. AppProviders loads
    // the administrator through /auth/me before the route guard opens.
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'cryo_admin_token',
        JSON.stringify({ state: { accessToken: 'admin-ui-test-token' }, version: 0 }),
      );
    });

    await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();

      if (path === '/api/auth/me' && method === 'GET') {
        await route.fulfill({
          json: {
            ...targetUser(),
            id: 'admin-presentation',
            email: 'admin@example.test',
            username: 'admin',
            displayName: 'Administrador de teste',
            role: 'ADMIN',
          },
        });
        return;
      }

      if (path === `/api/admin/users/${targetUserId}` && method === 'GET') {
        state.detailRequests += 1;
        await route.fulfill(
          state.missingUser || state.deleted
            ? { status: 404, json: { message: 'Usuário não encontrado' } }
            : { json: user },
        );
        return;
      }

      if (path === `/api/admin/users/${targetUserId}/role` && method === 'PATCH') {
        const { role } = request.postDataJSON() as { role: Role };
        state.roleRequests.push(role);
        if (state.rejectRoleChange) {
          await route.fulfill({
            status: 400,
            json: { message: 'Alteração de papel recusada para este teste.' },
          });
        } else {
          user.role = role;
          await route.fulfill({ json: user });
        }
        return;
      }

      if (path === `/api/admin/users/${targetUserId}/status` && method === 'PATCH') {
        const { status } = request.postDataJSON() as { status: string };
        state.statusRequests.push(status);
        user.status = status;
        await route.fulfill({ json: user });
        return;
      }

      if (path === `/api/admin/users/${targetUserId}` && method === 'DELETE') {
        state.deleted = true;
        await route.fulfill({ status: 204 });
        return;
      }

      if (path === '/api/admin/users' && method === 'GET') {
        await route.fulfill({
          json: {
            data: state.deleted ? [] : [user],
            total: state.deleted ? 0 : 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        });
        return;
      }

      if (path === '/api/admin/audit-logs' && method === 'GET') {
        await route.fulfill({
          json: { data: [], total: 0, page: 1, limit: 20, totalPages: 1 },
        });
        return;
      }

      if (path === '/api/admin/dashboard' && method === 'GET') {
        await route.fulfill({
          json: {
            totalUsers: state.deleted ? 1 : 2,
            activeUsers: state.deleted || user.status !== 'ACTIVE' ? 1 : 2,
            pendingVerification: 0,
            suspendedOrBanned: user.status === 'SUSPENDED' && !state.deleted ? 1 : 0,
            admins: user.role === 'ADMIN' && !state.deleted ? 2 : 1,
            newUsersToday: 0,
            newUsersLast30Days: [],
          },
        });
        return;
      }

      unexpectedRequests.push(`${method} ${path}`);
      await route.fulfill({ status: 404, json: { message: 'Rota não simulada.' } });
    });

    await use(state);
    expect(pageErrors, 'O painel não deve gerar exceções no navegador.').toEqual([]);
    expect(unexpectedRequests, 'Todas as chamadas devem usar a API simulada.').toEqual([]);
  },
});

test('alternar papel duas vezes atualiza o detalhe e os próximos pedidos sem recarregar', async ({
  page,
  adminMock,
}) => {
  await page.goto(`${adminOrigin}/users/${targetUserId}`);
  await expect(page.getByRole('heading', { name: 'Ana Silva' })).toBeVisible();
  await expect(page.getByText('USER', { exact: true })).toBeVisible();
  const initialDetailRequests = adminMock.detailRequests;
  const initialDocumentRequests = [...adminMock.documentRequests];
  const toggleRole = page.getByRole('button', { name: 'Alternar role', exact: true });

  await toggleRole.click();
  await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
  await expect(toggleRole).toBeEnabled();
  expect(adminMock.roleRequests).toEqual(['ADMIN']);
  expect(adminMock.detailRequests).toBeGreaterThan(initialDetailRequests);

  await toggleRole.click();
  await expect(page.getByText('USER', { exact: true })).toBeVisible();
  await expect(toggleRole).toBeEnabled();
  expect(adminMock.roleRequests).toEqual(['ADMIN', 'USER']);
  expect(adminMock.documentRequests).toEqual(initialDocumentRequests);
});

test('suspender atualiza o status do detalhe sem recarregar', async ({ page, adminMock }) => {
  await page.goto(`${adminOrigin}/users/${targetUserId}`);
  await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
  const initialDocumentRequests = [...adminMock.documentRequests];

  await page.getByRole('button', { name: 'Suspender', exact: true }).click();

  await expect(page.getByText('SUSPENDED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suspender', exact: true })).toBeEnabled();
  expect(adminMock.statusRequests).toEqual(['SUSPENDED']);
  expect(adminMock.documentRequests).toEqual(initialDocumentRequests);
});

test('alteração recusada mostra a mensagem e preserva o papel anterior', async ({
  page,
  adminMock,
}) => {
  adminMock.rejectRoleChange = true;
  await page.goto(`${adminOrigin}/users/${targetUserId}`);
  await expect(page.getByText('USER', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Alternar role', exact: true }).click();

  await expect(page.getByText('Alteração de papel recusada para este teste.')).toBeVisible();
  await expect(page.getByText('USER', { exact: true })).toBeVisible();
  await expect(page.getByText('ADMIN', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Alternar role', exact: true })).toBeEnabled();
  expect(adminMock.roleRequests).toEqual(['ADMIN']);
});

test('excluir retorna à lista e não mantém o detalhe do usuário removido', async ({
  page,
  adminMock,
}) => {
  await page.goto(`${adminOrigin}/users/${targetUserId}`);
  await expect(page.getByRole('heading', { name: 'Ana Silva' })).toBeVisible();

  await page.getByRole('button', { name: 'Excluir', exact: true }).click();

  await expect(page).toHaveURL(`${adminOrigin}/users`);
  await expect(page.getByPlaceholder('E-mail ou username')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ana Silva' })).toHaveCount(0);
  expect(adminMock.deleted).toBe(true);
});

test('detalhe inexistente mostra erro em vez de carregamento infinito', async ({
  page,
  adminMock,
}) => {
  adminMock.missingUser = true;
  await page.goto(`${adminOrigin}/users/${targetUserId}`);

  // The default React Query retries may take a few seconds; wait for the
  // visible result instead of assuming an arbitrary sleep duration.
  await expect(page.getByRole('alert')).toHaveText('Usuário não encontrado.', { timeout: 15_000 });
  await expect(page.getByText('Carregando…', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '← Voltar para usuários' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alternar role', exact: true })).toHaveCount(0);
});
