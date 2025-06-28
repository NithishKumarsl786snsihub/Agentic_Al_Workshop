'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Upload, 
  Mic, 
  Sparkles, 
  LogOut, 
  User, 
  FileText, 
  Settings,
  Zap,
  Globe,
  Clock,
  MoreHorizontal,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Import Create component as modal
import CreatePage from '../create/page';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateProject = (mode: 'voice' | 'upload') => {
    if (mode === 'voice') {
      setShowCreateModal(true);
    } else {
      // Future implementation for file upload
      console.log('File upload mode coming soon');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Define project type
  type Project = {
    id: string;
    name: string;
    type: string;
    lastModified: string;
    status: 'Published' | 'Draft';
    thumbnail?: string;
  };

  // Real projects data - currently empty, will be populated from API/database
  const userProjects: Project[] = []; // This will come from real data source
  const activeProjectsCount = userProjects.length;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400 opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400 opacity-8 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-400 opacity-5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                    VoiceWeb
                  </h1>
                  <p className="text-xs text-gray-600">Dashboard</p>
                </div>
              </Link>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-600 capitalize">{user.subscription_tier || 'Free'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-red-400 hover:text-red-600 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user.username}! 👋
                  </h2>
                  <p className="text-gray-600">Ready to create something amazing today?</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    {activeProjectsCount} Active Project{activeProjectsCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Voice Assistant Mode */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create with Voice</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Use natural language to build professional websites instantly
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="w-3 h-3 text-purple-500" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-3 h-3 text-purple-500" />
                    <span>Responsive</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-3 h-3 text-purple-500" />
                    <span>Real-time</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>Professional</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCreateProject('voice')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Start Creating
                </button>
              </div>
            </div>

            {/* File Upload Mode */}
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg opacity-75">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-400 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload & Edit</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Import existing HTML files and enhance with voice commands
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span>Import HTML</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Settings className="w-3 h-3" />
                    <span>Voice Edit</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>AI Enhance</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Globe className="w-3 h-3" />
                    <span>Optimize</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-3 px-4 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Projects</h3>
                <button 
                  onClick={() => handleCreateProject('voice')}
                  className="px-4 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {userProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userProjects.map((project) => (
                    <div key={project.id} className="bg-white/80 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                      <div className={`w-full h-32 ${project.thumbnail || 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                        <Globe className="w-8 h-8 text-white opacity-80" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                          <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{project.type}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'Published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{project.lastModified}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-300">
                            <Eye className="w-3 h-3 inline mr-1" />
                            View
                          </button>
                          <button className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all duration-300">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h4>
                  <p className="text-gray-600 mb-6">
                    Create your first website to get started
                  </p>
                  <button
                    onClick={() => handleCreateProject('voice')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Mic className="w-5 h-5" />
                    Create First Website
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Pro Tips for Better Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">✨ Be Specific</h4>
                  <p className="text-sm text-gray-600">
                    "Create a portfolio with dark theme and contact form"
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Use Examples</h4>
                  <p className="text-sm text-gray-600">
                    "Make it look like Apple's website with clean design"
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🔄 Iterate Freely</h4>
                  <p className="text-sm text-gray-600">
                    "Change header to blue and add hero section"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <CreatePage onClose={() => setShowCreateModal(false)} />
        </div>
      )}
    </>
  );
} 