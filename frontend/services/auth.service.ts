import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, User, RegisterRequest } from '@/types';

export type VerificationPurpose =
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'EMAIL_CHANGE'
  | 'WELCOME';

export interface RequestCodeResponse {
  sent: boolean;
  // The issued code is only included in development (no SMTP server) so the
  // recovery flow remains testable locally.
  devCode?: string;
}

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

  /**
   * Request a 6-digit verification code by email + purpose.
   * Returns metadata about the send (e.g. devCode in development).
   */
  async requestCode(
    email: string,
    purpose: VerificationPurpose,
    options?: { newEmail?: string }
  ): Promise<RequestCodeResponse> {
    return apiClient.post<RequestCodeResponse>('/auth/request-code', {
      email,
      purpose,
      newEmail: options?.newEmail,
    });
  },

  /**
   * Check whether a code is valid (does not consume it for a state change).
   */
  async verifyCode(
    email: string,
    code: string,
    purpose: VerificationPurpose
  ): Promise<boolean> {
    try {
      const res = await apiClient.post<{ valid: boolean }>('/auth/verify-code', {
        email,
        code,
        purpose,
      });
      return res.valid;
    } catch {
      return false;
    }
  },

  /**
   * Reset a proprietor password. Requires a valid code issued by requestCode.
   */
  async resetPasswordByCode(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/reset-password', { email, code, newPassword });
  },

  /**
   * Authenticated self-service password change. The current password is
   * required so a stolen access token alone is not enough to take over
   * the account.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  async registerProprietor(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    apiClient.setToken(response.accessToken);
    apiClient.setRefreshToken(response.refreshToken);
    apiClient.setUser(response.user);
    return response;
  },
};
