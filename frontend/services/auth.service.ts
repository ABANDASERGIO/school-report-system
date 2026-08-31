import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, User, RegisterRequest } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    apiClient.setToken(response.accessToken);
    apiClient.setRefreshToken(response.refreshToken);
    apiClient.setUser(response.user);
    return response;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiClient.get<User>('/auth/me');
      apiClient.setUser(user);
      return user;
    } catch {
      apiClient.clearAuth();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
    apiClient.clearAuth();
  },

  async hasProprietor(): Promise<boolean> {
    const response = await apiClient.get<{ exists: boolean }>('/auth/has-proprietor');
    return response.exists;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await apiClient.post<{ email: string }>('/auth/forgot-password', { email });
      return { email: response.email, role: 'PROPRIETOR' } as User;
    } catch {
      return null;
    }
  },

  async resetPasswordByEmail(email: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { email, newPassword });
  },

  async registerProprietor(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    apiClient.setToken(response.accessToken);
    apiClient.setRefreshToken(response.refreshToken);
    apiClient.setUser(response.user);
    return response;
  },

  // Mock fallback used by the teacher detail page
  async resetPassword(id: string, _newPassword: string): Promise<void> {
    await apiClient.post(`/teachers/${id}/reset-password`);
  },
};
