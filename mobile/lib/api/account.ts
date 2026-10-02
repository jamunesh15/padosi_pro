import { request } from './client';
import type { Account, SelectedTask, TaskCategory } from './types';

export type ProfileInput = {
  name: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  businessName?: string;
};

export const accountApi = {
  me: () => request<{ user: Account }>('/me'),

  saveProfile: (body: ProfileInput) =>
    request<{ user: Account }>('/me/profile', { method: 'PUT', body }),

  selectedTasks: () => request<{ tasks: SelectedTask[] }>('/me/tasks'),

  saveTasks: (taskIds: string[]) =>
    request<{ tasks: SelectedTask[] }>('/me/tasks', { method: 'PUT', body: { taskIds } }),

  catalogue: () => request<{ categories: TaskCategory[] }>('/tasks'),
};

export const queryKeys = {
  catalogue: ['catalogue'] as const,
  selectedTasks: ['selected-tasks'] as const,
};
