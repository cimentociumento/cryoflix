import { httpClient } from '../../shared/api/httpClient';
import type { UserProfile } from '../../shared/types';

export const userService = {
  async getProfile() {
    return httpClient<UserProfile>('/users/me');
  },
  async updatePreferences(preferences: Record<string, unknown>) {
    return httpClient<UserProfile>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    });
  },
  async getHistory(userId: string) {
    return httpClient<{ history: UserProfile['history'] }>(`/users/${userId}/history`);
  },
};

