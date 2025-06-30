'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  ExternalLink,
  Copy,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Project } from '../../services/api';
import { ImagePreviewCard } from '../../components/ImagePreviewCard';

// Import Create component as modal
import CreatePage from '../create/page';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const fetchUserProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjectsError(null);
      const response = await apiService.getUserProjects(20, 0);
      if (response.success) {
        setProjects(response.projects);
      } else {
        setProjectsError('Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjectsError('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await apiService.deleteProject(projectId);
      if (response.success) {
        // Remove from local state
        setProjects(projects.filter(p => p.project_id !== projectId));
        showToast('Project deleted successfully!', 'success');
      } else {
        showToast('Failed to delete project', 'error');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project', 'error');
    }
  };

  const handleViewProject = async (projectId: string, mode: 'edit' | 'view' = 'edit') => {
    try {
      const response = await apiService.loadProject(projectId);
      if (response.success) {
        // Store project data in sessionStorage for the editor
        const projectData = {
          project_id: projectId,
          project_name: response.project_name,
          description: response.description,
          html_content: response.html_content,
          last_modified: response.last_modified,
          mode: mode
        };
        sessionStorage.setItem('currentProject', JSON.stringify(projectData));
        
        // Redirect to editor with the project data
        router.push(`/editor?project=${projectId}&mode=${mode}`);
      } else {
        showToast('Failed to load project', 'error');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      showToast('Failed to load project', 'error');
    }
  };

  const handlePreviewProject = async (projectId: string) => {
    try {
      const response = await apiService.loadProject(projectId);
      if (response.success) {
        // Create a new window/tab with the HTML content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(response.html_content);
          newWindow.document.close();
          newWindow.document.title = response.project_name || 'Project Preview';
          showToast('Project preview opened in new tab!', 'success');
        } else {
          showToast('Please allow popups to preview the project', 'error');
        }
      } else {
        showToast('Failed to load project for preview', 'error');
      }
    } catch (error) {
      console.error('Error loading project for preview:', error);
      showToast('Failed to load project for preview', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRenameProject = async () => {
    if (!selectedProject || !newProjectName.trim()) {
      return;
    }

    try {
      const response = await apiService.renameProject(selectedProject.project_id, newProjectName.trim());
      if (response.success) {
        // Update the project in local state
        setProjects(projects.map(p => 
          p.project_id === selectedProject.project_id 
            ? { ...p, project_name: newProjectName.trim() }
            : p
        ));
        setShowRenameModal(false);
        setSelectedProject(null);
        setNewProjectName('');
        showToast('Project renamed successfully!', 'success');
      } else {
        showToast('Failed to rename project', 'error');
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      showToast('Failed to rename project', 'error');
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const response = await apiService.duplicateProject(projectId);
      if (response.success) {
        // Refresh the projects list to show the new duplicate
        await fetchUserProjects();
        showToast('Project duplicated successfully!', 'success');
      } else {
        showToast('Failed to duplicate project', 'error');
      }
    } catch (error) {
      console.error('Error duplicating project:', error);
      showToast('Failed to duplicate project', 'error');
    }
  };

  const openRenameModal = (project: Project) => {
    setSelectedProject(project);
    setNewProjectName(project.project_name);
    setShowRenameModal(true);
    setOpenDropdown(null);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setSelectedProject(null);
    setNewProjectName('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

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

  const activeProjectsCount = projects.length;

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchUserProjects}
                    className="p-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
                    title="Refresh"
                    disabled={projectsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${projectsLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleCreateProject('voice')}
                    className="px-4 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              ) : projectsError ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Error loading projects</h4>
                  <p className="text-red-600 mb-6">{projectsError}</p>
                  <button
                    onClick={fetchUserProjects}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <ImagePreviewCard
                      key={project.project_id}
                      project={project}
                      onPreview={handlePreviewProject}
                      onEdit={() => handleViewProject(project.project_id)}
                      onDelete={handleDeleteProject}
                      onRename={openRenameModal}
                      onDuplicate={(projectId) => {
                        handleDuplicateProject(projectId);
                        setOpenDropdown(null);
                      }}
                      isDropdownOpen={openDropdown === project.project_id}
                      onDropdownToggle={(projectId) => {
                        setOpenDropdown(openDropdown === projectId ? null : projectId);
                      }}
                    />
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

      {/* Rename Modal */}
      {showRenameModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rename Project</h3>
              <button
                onClick={closeRenameModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                placeholder="Enter project name"
                maxLength={100}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameProject();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newProjectName.length}/100 characters
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={closeRenameModal}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameProject}
                disabled={!newProjectName.trim() || newProjectName.trim() === selectedProject.project_name}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <CreatePage 
            onClose={() => {
              setShowCreateModal(false);
              // Refresh projects when modal closes in case a new project was created
              fetchUserProjects();
            }} 
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
} 