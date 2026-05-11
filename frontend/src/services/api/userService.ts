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

  async updateProfile(payload: {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  }) {
    return httpClient<UserProfile>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async getHistory(userId: string) {
    return httpClient<{ history: UserProfile['history'] }>(`/users/${userId}/history`);
  },
  async deleteMyAccount() {
    return httpClient<void>('/users/me', {
      method: 'DELETE',
    });
  },
};

