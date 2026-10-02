const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly data: Record<string, unknown> = {}
  ) {
    super(message);
  }

  get fields(): Record<string, string> {
    return (this.data.fields as Record<string, string> | undefined) ?? {};
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

let authToken: string | null = null;
let handleUnauthorized: (() => void) | undefined;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function onUnauthorized(handler: () => void) {
  handleUnauthorized = handler;
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PUT'; body?: unknown };

export async function request<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const sentToken = authToken;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(sentToken && { Authorization: `Bearer ${sentToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach PadosiPro right now. Check your connection and try again."
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error ?? {};
    if (response.status === 401 && sentToken) handleUnauthorized?.();
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Something went wrong. Please try again.',
      error
    );
  }
  return data as T;
}
