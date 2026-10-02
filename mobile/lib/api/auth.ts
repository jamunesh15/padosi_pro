import { request } from './client';
import type { CodeDelivery, Session } from './types';

type Credentials = { email: string; password: string };

export const authApi = {
  register: (body: Credentials & { confirmPassword: string }) =>
    request<CodeDelivery & { email: string }>('/auth/register', { method: 'POST', body }),

  verifyEmail: (body: { email: string; code: string }) =>
    request<Session>('/auth/verify-email', { method: 'POST', body }),

  resendCode: (email: string) =>
    request<CodeDelivery>('/auth/resend-code', { method: 'POST', body: { email } }),

  login: (body: Credentials) => request<Session>('/auth/login', { method: 'POST', body }),
};
