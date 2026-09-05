const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

const STORAGE_TOKEN_KEY = 'edugrade_token';
const STORAGE_REFRESH_KEY = 'edugrade_refresh_token';
const STORAGE_USER_KEY = 'edugrade_user';

function sanitizeErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("can't reach database server") ||
    lower.includes('database server') ||
    lower.includes('connection refused') ||
    lower.includes('etimedout') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('prisma') ||
    lower.includes('pooler') ||
    lower.includes('neon') ||
    lower.includes('postgresql') ||
    lower.includes('database') ||
    lower.includes('network') ||
    lower.includes('fetch failed')
  ) {
    return 'Service is temporarily unavailable. Please check your internet connection and try again.';
  }
  return message;
}

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    }
  }

  setToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    }
  }

  setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_REFRESH_KEY, token);
    }
  }

  setUser(user: unknown) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    }
  }

  getUser<T>(): T | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  clearAuth() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_REFRESH_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const refreshToken = localStorage.getItem(STORAGE_REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data: ApiSuccess<{
        accessToken: string;
        refreshToken: string;
        user: unknown;
      }> = await response.json();

      if (data.success) {
        this.setToken(data.data.accessToken);
        this.setRefreshToken(data.data.refreshToken);
        this.setUser(data.data.user);
        this.onTokenRefreshed(data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Re-read the latest token from localStorage on every request.
    // This handles cases where the token was updated in a different module instance.
    if (typeof window !== 'undefined' && !this.accessToken) {
      this.accessToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (networkError) {
      console.error(`[API] Network error for ${endpoint}:`, networkError);
      throw new Error(
        'Cannot reach the server. Please check your internet connection and try again.'
      );
    }

    // If 401, try refresh
    if (response.status === 401 && this.isAuthenticated()) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const refreshed = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh failed, clear auth
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // Wait for ongoing refresh
        await new Promise<void>((resolve) => {
          this.subscribeTokenRefresh((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve();
          });
        });
        response = await fetch(url, { ...options, headers });
      }
    }

    let body: ApiResponse<T> | null = null;
    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (!body.success) {
      const sanitized = sanitizeErrorMessage(body.message || `Request failed with status ${response.status}`);
      throw new Error(sanitized);
    }

    return body.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * POST a multipart/form-data payload. The fetch body is a FormData instance
   * so the browser sets the Content-Type with the correct boundary.
   * The Authorization header is added explicitly because we do not set
   * Content-Type here (FormData needs to set it itself).
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    if (typeof window !== 'undefined' && !this.accessToken) {
      this.accessToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    }

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const doFetch = async () => {
      const res = await fetch(url, { method: 'POST', body: formData, headers });
      return res;
    };

    let response: Response;
    try {
      response = await doFetch();
    } catch (networkError) {
      console.error(`[API] Network error for ${endpoint}:`, networkError);
      throw new Error(
        `Cannot reach the server at ${API_BASE_URL}. Please make sure the backend is running.`
      );
    }

    if (response.status === 401 && this.isAuthenticated()) {
      // Reuse the refresh logic via a normal request that we craft manually.
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await doFetch();
      } else {
        this.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    let body: ApiResponse<T> | null = null;
    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (!body.success) {
      throw new Error(body.message || `Request failed with status ${response.status}`);
    }

    return body.data;
  }
}

export const apiClient = new ApiClient();
export { API_BASE_URL };
