const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...defaultOptions,
          ...options,
          headers: {
            ...defaultOptions.headers,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          
          // Don't retry on auth errors (401, 403)
          if (response.status === 401 || response.status === 403) {
            throw new Error(errorData.detail || `Authentication failed: ${response.status}`);
          }
          
          // Don't retry on client errors (400-499) except rate limiting (429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(errorData.detail || `Client error: ${response.status}`);
          }
          
          // Retry on server errors (500+) and rate limiting
          if (attempt < retries && (response.status >= 500 || response.status === 429)) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.warn(`Request failed with ${response.status}, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        // Handle network errors (no response)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`Network error, retrying in ${delay}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(`Network error: Unable to connect to server. Please check your internet connection.`);
          }
        }
        
        // Re-throw other errors (like auth errors)
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store tokens
    this.setTokens(response.tokens);
    this.setUser(response.user);

    return response;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    this.setTokens(response.tokens);
    this.setUser(response.user);

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest<{ user: User; message: string }>('/auth/me', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    this.setUser(response.user);
    return response.user;
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.makeRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    this.setTokens(response);
    return response;
  }

  async validateToken(): Promise<boolean> {
    // First check local expiration to avoid unnecessary network calls
    if (this.isTokenExpired()) {
      console.log('🕐 Token expired locally, skipping network validation');
      return false;
    }
    
    try {
      await this.makeRequest('/auth/validate-token', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }, 1); // Only 1 retry for validation
      return true;
    } catch (error) {
      console.warn('🌐 Token validation failed:', error);
      return false;
    }
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('token_expires_in', tokens.expires_in.toString());
      
      // Store token creation time for expiration checking
      const expirationTime = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('token_expires_at', expirationTime.toString());
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // User management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }
    }
    return null;
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_in');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('user');
    }
  }

  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    // Consider token expired if it expires within the next 5 minutes
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (parseInt(expiresAt) - buffer);
  }

  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getUser();
    const isNotExpired = !this.isTokenExpired();
    
    return hasToken && hasUser && isNotExpired;
  }

  getTokenExpirationTime(): number | null {
    if (typeof window === 'undefined') return null;
    
    const expiresAt = localStorage.getItem('token_expires_at');
    return expiresAt ? parseInt(expiresAt) : null;
  }

  // Auto-refresh token when it expires
  async handleTokenExpiration(): Promise<boolean> {
    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }
}

export const authService = new AuthService(); 