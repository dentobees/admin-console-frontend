// Thin fetch wrapper (same shape as the sales CRM's lib/api.ts). The API is on
// the same origin under /api (nginx in prod, Next rewrite in dev), so the
// host-only session cookie rides along. Mutations carry the X-Admin-Request
// header the backend's CSRF guard requires (eng review: CSRF).
import { mockGet, mockSend } from './mock';

export const MOCK = process.env.NEXT_PUBLIC_API_MOCK === '1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function toError(res: Response): Promise<ApiError> {
  let msg = res.statusText;
  try {
    const data = await res.json();
    msg = data.message || msg;
  } catch {
    /* ignore */
  }
  return new ApiError(res.status, msg);
}

export async function apiGet<T>(path: string): Promise<T> {
  if (MOCK) return mockGet<T>(path);
  const res = await fetch(`/api${path}`, { credentials: 'same-origin' });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function apiSend<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (MOCK) return mockSend<T>(method, path, body);
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', 'x-admin-request': '1' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await toError(res);
  return res.status === 204 ? (undefined as T) : res.json();
}

/** 503 from a live read means the CRM replica was unreachable (C4). */
export function isUnavailable(e: unknown): boolean {
  return e instanceof ApiError && e.status === 503;
}
