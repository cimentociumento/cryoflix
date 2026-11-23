import { tokenStore } from './tokenStore';

const DEFAULT_TIMEOUT = 5000;
const REFRESH_PATH = '/auth/refresh';

const getBaseUrl = () => import.meta.env.VITE_API_URL ?? '/api';

export const resolveApiBaseUrl = () => getBaseUrl();

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const rawFetch = async (path: string, options: RequestInit, token: string | null) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    return await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

// Várias requests podem tomar 401 ao mesmo tempo (token expirou); só a
// primeira dispara o refresh de verdade, as outras esperam a mesma promise —
// senão cada uma dispararia sua própria chamada a /auth/refresh.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = rawFetch(REFRESH_PATH, { method: 'POST', body: '{}' }, null)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const data = (await response.json()) as { accessToken?: string };
        tokenStore.set(data.accessToken ?? null);
        return data.accessToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export async function httpClient<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const response = await rawFetch(path, options, tokenStore.get());

  if (response.status === 401 && !retried && path !== REFRESH_PATH) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return httpClient<T>(path, options, true);
    }
    tokenStore.set(null);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new HttpError(
      errorBody.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

