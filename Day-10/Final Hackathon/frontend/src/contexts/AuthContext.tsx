'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is stored in localStorage
        const storedUser = authService.getUser();
        const token = authService.getToken();
        
        console.log('🔄 Initializing auth:', { hasUser: !!storedUser, hasToken: !!token });
        
        if (storedUser && token) {
          // Check if token is expired locally first
          if (authService.isTokenExpired()) {
            console.log('🕐 Token expired locally, trying to refresh...');
            try {
              await authService.refreshToken();
              const refreshedUser = authService.getUser(); // Get user from localStorage after refresh
              if (refreshedUser) {
                setUser(refreshedUser);
                console.log('✅ Token refreshed successfully');
              } else {
                console.log('❌ No user data after refresh, clearing auth');
                authService.clearAuth();
                setUser(null);
              }
            } catch (refreshError) {
              console.log('❌ Token refresh failed, clearing auth:', refreshError);
              authService.clearAuth();
              setUser(null);
            }
          } else {
            // Token is not expired locally, use stored user data
            console.log('✅ Using stored user data (token not expired)');
            setUser(storedUser);
            
            // Optionally validate token in background, but don't block or fail based on this
            try {
              const isValidToken = await authService.validateToken();
              if (!isValidToken) {
                console.log('⚠️ Token validation failed in background, but keeping user logged in');
              }
            } catch (validationError) {
              console.log('⚠️ Token validation error in background:', validationError);
              // Don't fail - just continue with stored user
            }
          }
        } else {
          console.log('ℹ️ No stored user or token found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Clear auth only if it's definitely an auth issue
        authService.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up less aggressive token refresh with better error handling
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const now = Date.now();
      
      // Only check every 30 minutes instead of 5 minutes
      if (now - lastTokenCheck < 30 * 60 * 1000) {
        return;
      }

      console.log('🔄 Periodic token check...');

      try {
        // Check local expiration first
        if (authService.isTokenExpired()) {
          console.log('🕐 Token expired locally, attempting refresh...');
          try {
            await authService.refreshToken();
            console.log('✅ Token auto-refreshed');
            setRetryCount(0);
          } catch (refreshError) {
            console.log('❌ Auto-refresh failed:', refreshError);
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              console.log(`🔄 Will retry, attempt ${retryCount + 1}/3`);
              return;
            } else {
              console.log('🚪 Max retries reached, clearing auth');
              setUser(null);
              authService.clearAuth();
            }
          }
        } else {
          console.log('✅ Token not expired locally');
          setRetryCount(0);
        }
        
        setLastTokenCheck(now);
      } catch (error) {
        console.warn('⚠️ Token check failed:', error);
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, lastTokenCheck, retryCount]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser back online, resetting retry count');
      setRetryCount(0);
      setLastTokenCheck(0); // Force immediate token check when back online
    };

    const handleOffline = () => {
      console.log('🌐 Browser offline detected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      setRetryCount(0); // Reset retry count on successful login
      setLastTokenCheck(Date.now()); // Update last check time
      console.log('✅ User logged in successfully');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      setRetryCount(0); // Reset retry count on successful registration
      setLastTokenCheck(Date.now()); // Update last check time
      console.log('✅ User registered successfully');
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setRetryCount(0);
      setLastTokenCheck(0);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear state anyway - don't keep user logged in if they want to logout
      authService.clearAuth();
      setUser(null);
      setRetryCount(0);
      setLastTokenCheck(0);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        console.log('✅ User info refreshed');
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      // Don't clear auth on user refresh failure - might be temporary
      console.warn('🌐 Failed to refresh user info, keeping existing session');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h3>
            <p className="text-gray-600">Please wait while we verify your session...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // You might want to redirect to login page here
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
} 