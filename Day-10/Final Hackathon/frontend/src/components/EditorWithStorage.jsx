import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useEditorStore from '../store/editorStore';
import useStoragePersistence from '../hooks/useStoragePersistence';
import storageService from '../services/storageService';
import ExitWarningModal from './ExitWarningModal';
import { 
  DocumentArrowDownIcon, 
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/apiService';

/**
 * 🎯 EDITOR WITH STORAGE - Complete Implementation Example
 * Shows how to replace localStorage with MongoDB persistence
 */
const EditorWithStorage = () => {
  const router = useRouter();
  const editorRef = useRef(null);
  
  // Zustand store state
  const {
    htmlContent,
    cssContent,
    jsContent,
    projectName,
    description,
    hasUnsavedChanges,
    isAuthenticated,
    currentUser,
    sessionId,
    projectId,
    lastSaved,
    isSaving,
    isAutoSaving,
    saveError,
    setHtmlContent,
    setCssContent,
    setJsContent,
    setProjectMetadata,
    setSessionId,
    setCursorPosition,
    setScrollPosition,
    setIsSaving,
    setError
  } = useEditorStore();

  // Storage persistence hook
  const {
    saveProject,
    loadProject,
    showExitWarning,
    exitWarningData,
    handleExitWarningSave,
    handleExitWarningDiscard,
    handleExitWarningCancel,
    interceptNavigation,
    handleExitAttempt,
    getUnsavedChangesCount
  } = useStoragePersistence({
    enableAutoSave: true,
    enableExitWarning: true,
    enableBeforeUnload: true
  });

  // Local component state
  const [projects, setProjects] = useState([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ========== INITIALIZATION ==========

  useEffect(() => {
    // Initialize session if not exists
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      console.log('🚀 New session created:', newSessionId);
    }

    // Clear any legacy localStorage data
    storageService.clearLegacyLocalStorage();
  }, [sessionId, setSessionId]);

  // ========== PROJECT MANAGEMENT ==========

  const handleSave = async (isAutoSave = false) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    const projectData = JSON.parse(sessionStorage.getItem('currentProject') || '{}');

    try {
      const previewResponse = await apiService.generatePreviews({
        html_content: htmlContent,
        project_id: projectData.project_id
      });

      const response = await apiService.saveFromEditor({
        session_id: sessionId,
        html_content: htmlContent,
        project_id: projectData.project_id,
        project_name: projectData.project_name,
        description: projectData.description,
        auto_save: isAutoSave,
        preview_image: previewResponse.full,
        thumbnail_image: previewResponse.thumbnail
      });

      if (!response.success) {
        throw new Error(response.error || 'Save failed');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (projectToLoad) => {
    try {
      const projectData = await loadProject({ 
        projectId: projectToLoad.project_id 
      });
      
      console.log('✅ Project loaded:', projectData.project_id);
      setShowProjectList(false);
      
      showNotification('Project loaded successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Load failed:', error);
      showNotification(error.message, 'error');
    }
  };

  const loadProjectList = async () => {
    if (!isAuthenticated) return;
    
    setLoadingProjects(true);
    try {
      const result = await storageService.listProjects({
        limit: 20,
        search: searchQuery
      });
      
      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  // ========== EDITOR EVENTS ==========

  const handleContentChange = (content, type) => {
    switch (type) {
      case 'html':
        setHtmlContent(content);
        break;
      case 'css':
        setCssContent(content);
        break;
      case 'js':
        setJsContent(content);
        break;
    }
    
    // Track cursor position for auto-save
    if (editorRef.current) {
      const selection = window.getSelection();
      setCursorPosition({
        line: 1, // In a real editor, get actual line/column
        column: selection.anchorOffset
      });
    }
  };

  const handleScroll = (event) => {
    setScrollPosition({
      top: event.target.scrollTop,
      left: event.target.scrollLeft
    });
  };

  // ========== NAVIGATION HANDLING ==========

  const handleNavigation = (href) => {
    const canNavigate = interceptNavigation(href);
    if (!canNavigate) {
      // Navigation was blocked due to unsaved changes
      console.log('🚫 Navigation blocked - unsaved changes');
    }
  };

  const handleBackButton = () => {
    handleExitAttempt(() => {
      router.back();
    });
  };

  // ========== NOTIFICATIONS ==========

  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // ========== KEYBOARD SHORTCUTS ==========

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      
      // Ctrl/Cmd + O to open project list
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        setShowProjectList(true);
        loadProjectList();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackButton}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {projectName || 'Untitled Project'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isAutoSaving ? (
                    <span className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1 animate-spin" />
                      Auto-saving...
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center">
                      <CheckCircleIcon className="h-3 w-3 mr-1 text-green-500" />
                      Saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-amber-500" />
                      Unsaved changes
                    </span>
                  ) : (
                    'Ready'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Project List Button */}
              <button
                onClick={() => {
                  setShowProjectList(true);
                  loadProjectList();
                }}
                disabled={!isAuthenticated}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FolderOpenIcon className="h-4 w-4 mr-2" />
                Projects
              </button>

              {/* Save Button */}
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || !isAuthenticated || !hasUnsavedChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectMetadata(e.target.value, description)}
                placeholder="Enter project name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content
              </label>
              <textarea
                ref={editorRef}
                value={htmlContent}
                onChange={(e) => handleContentChange(e.target.value, 'html')}
                onScroll={handleScroll}
                placeholder="Enter your HTML code here..."
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Content
              </label>
              <textarea
                value={cssContent}
                onChange={(e) => handleContentChange(e.target.value, 'css')}
                placeholder="Enter your CSS code here..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Live Preview
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <iframe
                srcDoc={`
                  <html>
                    <head>
                      <style>${cssContent}</style>
                    </head>
                    <body>
                      ${htmlContent}
                      <script>${jsContent}</script>
                    </body>
                  </html>
                `}
                className="w-full h-96"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Project List Modal */}
      {showProjectList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-96 overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Projects</h3>
                <button
                  onClick={() => setShowProjectList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="p-6 overflow-y-auto max-h-64">
              {loadingProjects ? (
                <div className="text-center py-4">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No projects found
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.project_id}
                      onClick={() => handleLoad(project)}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <h4 className="font-medium">{project.project_name}</h4>
                      <p className="text-sm text-gray-500">
                        Last modified: {new Date(project.last_modified).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Warning Modal */}
      <ExitWarningModal
        isOpen={showExitWarning}
        onClose={handleExitWarningCancel}
        onSave={handleExitWarningSave}
        onDiscard={handleExitWarningDiscard}
        onCancel={handleExitWarningCancel}
        unsavedChangesCount={getUnsavedChangesCount()}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-md shadow-lg ${
              notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Save Status Indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 bg-amber-100 border border-amber-200 text-amber-800 px-3 py-2 rounded-md shadow-lg">
          <span className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Unsaved changes
          </span>
        </div>
      )}

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-md shadow-lg">
          <p className="text-sm">
            <strong>Sign in</strong> to save your projects permanently
          </p>
        </div>
      )}
    </div>
  );
};

export default EditorWithStorage; 