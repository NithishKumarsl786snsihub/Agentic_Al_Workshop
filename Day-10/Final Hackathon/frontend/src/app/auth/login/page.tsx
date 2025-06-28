'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(formData);
      // Redirect to dashboard or home page
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects - Reduced */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500 opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-52 h-52 bg-pink-500 opacity-3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Reduced floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white opacity-10 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content - Split Layout (Opposite of Register) */}
      <div className="relative z-10 flex h-screen">
        {/* Left Side - Welcome Section */}
        <div className="w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-gray-900/50 backdrop-blur-sm">
          <div className="text-center animate-fade-in">
            {/* Large Welcome Icon */}
            <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center shadow-2xl transform transition-transform duration-500 hover:scale-105">
              <LogIn className="w-16 h-16 text-white opacity-60" />
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Welcome
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Back!
                </span>
              </h1>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Sign In to Continue</h2>
                <p className="text-gray-300 text-lg leading-relaxed max-w-sm mx-auto">
                  Access your account and continue creating amazing websites
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-300"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-700"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Login Card - Reduced padding and spacing */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-[1.01] hover:shadow-purple-500/20">
              
              {/* Error Message - Compact */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 backdrop-blur-sm animate-shake">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                      <p className="font-medium text-sm text-red-400">Error</p>
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                </div>
              </div>
            )}

              {/* Login Form - Compact spacing */}
              <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1.5">
                    Email Address *
                </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-200" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1.5">
                    Password *
                </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-200" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                      className="w-full pl-8 pr-8 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-purple-400 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

                {/* Submit Button - Compact */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.email || !formData.password}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                      <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

              {/* Divider - Compact */}
              <div className="my-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-transparent text-gray-400">
                      Need an account?
                  </span>
                  </div>
              </div>
            </div>

              {/* Register Link - Compact */}
            <div className="text-center">
              <Link
                href="/auth/register"
                  className="w-full py-2.5 px-4 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm transform transition-all duration-200 hover:scale-[1.01] inline-block text-sm"
              >
                Create New Account
              </Link>
            </div>

              {/* Additional Links */}
              <div className="text-center mt-3">
                <Link
                  href="/auth/forgot-password"
                  className="text-gray-400 hover:text-purple-400 transition-colors duration-200 text-xs"
                >
                  Forgot your password?
                </Link>
              </div>
          </div>

            {/* Footer Links - Compact */}
            <div className="text-center mt-4">
              <Link 
                href="/" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-xs flex items-center justify-center gap-1 hover:scale-105 transform transition-transform"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
} 