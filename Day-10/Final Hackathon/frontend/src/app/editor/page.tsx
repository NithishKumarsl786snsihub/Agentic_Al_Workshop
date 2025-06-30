'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Maximize, 
  Save, 
  Code, 
  Eye, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Mic,
  MicOff,
  Zap,
  User,
  Send,
  X,
  Volume2,
  Edit
} from 'lucide-react';
import { VoiceButton } from '../../components/VoiceButton';
import { ClientOnly } from '../../components/ClientOnly';
import { IntelligentResponseComponent } from '../../components/IntelligentResponse';
import ExitConfirmationModal from '../../components/ExitConfirmationModal';
import { apiService, IntelligentResponse, EditorSaveRequest } from '../../services/api';
import { useSessionStorage } from '../../hooks/useSessionStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import clsx from 'clsx';

// Custom Chat Voice Button Component
const ChatVoiceButton: React.FC<{
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  disabled?: boolean;
}> = React.memo(({ onTranscript, onInterimTranscript, disabled }) => {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening
  } = useVoiceRecognition();

  React.useEffect(() => {
    if (transcript) {
      if (isListening && onInterimTranscript) {
        onInterimTranscript(transcript);
      } else if (!isListening && transcript) {
        onTranscript(transcript);
      }
    }
  }, [transcript, isListening]); // Removed callback dependencies to prevent infinite loop

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        title="Voice input not supported"
      >
        <MicOff className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={clsx(
          "p-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center",
          isListening 
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse" 
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30",
          disabled && "opacity-50 cursor-not-allowed transform-none"
        )}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      
      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
      )}
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
});

ChatVoiceButton.displayName = 'ChatVoiceButton';



export default function EditorPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { currentSession, updateCurrentHtml } = useSessionStorage();

  const [htmlContent, setHtmlContent] = useState('');
  const [originalHtmlContent, setOriginalHtmlContent] = useState('');
  const [editCommand, setEditCommand] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [baseEditCommand, setBaseEditCommand] = useState('');
  const [intelligentResponse, setIntelligentResponse] = useState<IntelligentResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    intelligentResponse?: IntelligentResponse;
  }>>([]);

  // Project-related state
  const [currentProject, setCurrentProject] = useState<{
    project_id: string;
    project_name: string;
    description: string;
    html_content: string;
    last_modified: string;
    mode: 'edit' | 'view';
  } | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');

  const editCommandRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const baseEditCommandRef = useRef(baseEditCommand);

  // Keep ref in sync with state
  useEffect(() => {
    baseEditCommandRef.current = baseEditCommand;
  }, [baseEditCommand]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = htmlContent !== originalHtmlContent;
    setHasUnsavedChanges(hasChanges);
  }, [htmlContent, originalHtmlContent]);

  // Initialize content from project or session - ONLY after authentication is ready
  useEffect(() => {
    const initializeContent = async () => {
      // Wait for authentication to be fully initialized
      if (authLoading) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      try {
        // Check if we're editing an existing project
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');
        const mode = urlParams.get('mode') as 'edit' | 'view' || 'edit';

        if (projectId) {
          // Load project from sessionStorage first (set by dashboard)
          const storedProject = sessionStorage.getItem('currentProject');
          if (storedProject) {
            const projectData = JSON.parse(storedProject);
            setCurrentProject(projectData);
            setProjectNameInput(projectData.project_name);
            setHtmlContent(projectData.html_content);
            setOriginalHtmlContent(projectData.html_content);
            setIsLoading(false);
            return;
          }

          // Fallback: Load project from API
          try {
            const response = await apiService.loadProject(projectId);
            if (response.success) {
              const projectData = {
                project_id: projectId,
                project_name: response.project_name || 'Untitled Project',
                description: response.description || '',
                html_content: response.html_content,
                last_modified: response.last_modified,
                mode: mode
              };
              setCurrentProject(projectData);
              setProjectNameInput(projectData.project_name);
              setHtmlContent(response.html_content);
              setOriginalHtmlContent(response.html_content);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Failed to load project:', error);
          }
        }

        // Fallback to session-based editing (legacy mode)
        if (!currentSession) {
          return;
        }
        
        setHtmlContent(currentSession.htmlContent);
        setOriginalHtmlContent(currentSession.htmlContent);
        
        // Load from MongoDB if available - with proper error handling
        try {
          const sessionData = await apiService.getSessionHistory(currentSession.sessionId);
          if (sessionData.success && sessionData.html_content) {
            setHtmlContent(sessionData.html_content);
            setOriginalHtmlContent(sessionData.html_content);
          }
        } catch (error) {
          console.warn('Could not load session from MongoDB, using local data:', error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error during editor initialization:', error);
        setIsLoading(false);
        setMessage({ type: 'error', text: 'Failed to initialize editor' });
      }
    };

    // Add a small delay to ensure everything is ready
    const initTimer = setTimeout(() => {
      initializeContent();
    }, 100);

    return () => clearTimeout(initTimer);
  }, [router, authLoading, isAuthenticated, user, currentSession]);

  // Additional effect to handle the case where we're still waiting for session after auth is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated && !currentSession && !currentProject && !isLoading) {
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 2000); // Wait 2 seconds for session to potentially load
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authLoading, isAuthenticated, currentSession, currentProject, isLoading, router]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isEditing]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle browser/tab close warning and back button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    // Handle browser back button
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges && !showExitModal) {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent navigation by pushing the current state back
        window.history.pushState(null, '', window.location.href);
        
        // Show exit modal
        setShowExitModal(true);
        setPendingNavigation('/dashboard');
      }
    };

    // Handle keyboard shortcuts (Ctrl+W, Alt+F4, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W or Cmd+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        if (hasUnsavedChanges) {
          e.preventDefault();
          setShowExitModal(true);
          setPendingNavigation('/dashboard');
        }
      }
      // Escape key
      if (e.key === 'Escape' && !showExitModal) {
        if (hasUnsavedChanges) {
          setShowExitModal(true);
          setPendingNavigation('/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    };

    // Add initial history state to detect back button
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, showExitModal, router]);

  // Fix iframe preview update issue with robust refresh logic
  useEffect(() => {
    if (viewMode === 'preview') {
      setIsPreviewLoading(true);
      
      // Force complete iframe re-render by updating key
      setIframeKey(prev => prev + 1);
      
      // Additional refresh logic for existing iframe
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        
        // Method 1: Clear and reset srcdoc
        iframe.srcdoc = '';
        
        // Method 2: Force reload after a brief delay
        setTimeout(() => {
          iframe.srcdoc = htmlContent;
          
          // Method 3: Fallback - use data URL approach if srcdoc fails
          setTimeout(() => {
            if (!iframe.contentDocument || iframe.contentDocument.body.innerHTML.trim() === '') {
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              iframe.src = url;
              
              // Clean up blob URL after loading
              iframe.onload = () => {
                URL.revokeObjectURL(url);
                setIsPreviewLoading(false);
              };
            } else {
              setIsPreviewLoading(false);
            }
          }, 100);
        }, 50);
      } else {
        // If no existing iframe ref, loading will be handled by the new iframe
        setTimeout(() => setIsPreviewLoading(false), 300);
      }
    }
  }, [viewMode, htmlContent]);

    // Handle manual code changes while in preview mode
  useEffect(() => {
    if (viewMode === 'preview' && iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Debounce content updates to avoid excessive reloads during typing
      const timeoutId = setTimeout(() => {
        setIsPreviewLoading(true);
        
        // Try direct srcdoc update first
        iframe.srcdoc = htmlContent;
        
        // Verify the content was updated and handle loading state
        setTimeout(() => {
          if (!iframe.contentDocument || 
              !iframe.contentDocument.body || 
              iframe.contentDocument.body.innerHTML.trim() === '') {
            // Fallback: Force complete refresh with new key
            setIframeKey(prev => prev + 1);
          } else {
            setIsPreviewLoading(false);
          }
        }, 150);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [htmlContent]);

  const handleVoiceCommand = useCallback((transcript: string) => {
    const finalText = baseEditCommandRef.current + transcript;
    setEditCommand(finalText);
    setBaseEditCommand(finalText);
    setIsVoiceActive(false);
  }, []); // No dependencies needed since we use ref

  const handleInterimVoiceCommand = useCallback((transcript: string) => {
    setEditCommand(baseEditCommandRef.current + transcript);
    setIsVoiceActive(true);
  }, []); // No dependencies needed since we use ref

  const handleEditCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditCommand(newValue);
    if (!isVoiceActive) {
      setBaseEditCommand(newValue);
    }
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
    
    if (intelligentResponse && !isVoiceActive) {
      setIntelligentResponse(null);
    }
  };

  const handleEdit = async () => {
    if (!editCommand.trim() || !currentSession) {
      setMessage({ type: 'error', text: 'Please enter an edit command or use voice input' });
      return;
    }

    const userMessage = {
      type: 'user' as const,
      content: editCommand.trim(),
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);

    setIsEditing(true);
    setMessage(null);
    setIntelligentResponse(null);

    try {
      const response = await apiService.editWebsite({
        html_content: htmlContent,
        edit_command: editCommand.trim(),
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        updateCurrentHtml(response.html_content, 'edit', editCommand.trim());
        
        // Save to MongoDB
        await saveToMongoDB(response.html_content);
        
        const aiMessage = {
          type: 'ai' as const,
          content: response.message,
          timestamp: new Date(),
          intelligentResponse: response.intelligent_response
        };
        setConversationHistory(prev => [...prev, aiMessage]);
        
        if (response.intelligent_response) {
          setIntelligentResponse(response.intelligent_response);
        }

        setMessage({ type: 'success', text: response.message });
          setEditCommand('');
          setBaseEditCommand('');
        
        // Update undo/redo state
        setCanUndo(true);
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err: any) {
      console.error('Edit error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to edit website' });
    } finally {
      setIsEditing(false);
    }
  };

  const saveToMongoDB = async (htmlContent: string) => {
    try {
      if (currentSession && user) {
        await apiService.saveConversation({
          final_prompt: `Updated HTML content for session ${currentSession.sessionId}`,
          session_id: currentSession.sessionId,
          metadata: {
            html_content: htmlContent,
            action: 'edit_content',
            timestamp: Date.now(),
            user_id: user.id
          }
        });
      }
    } catch (error) {
      console.warn('Failed to save to MongoDB:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentProject) {
        // Update existing project
        const response = await apiService.updateProject(currentProject.project_id, {
          html_content: htmlContent,
          project_name: currentProject.project_name
        });

        if (response.success) {
          setOriginalHtmlContent(htmlContent);
          // Update current project data
          setCurrentProject(prev => prev ? { 
            ...prev, 
            html_content: htmlContent,
            last_modified: new Date().toISOString()
          } : null);
          
          setMessage({ 
            type: 'success', 
            text: `Project "${currentProject.project_name}" updated successfully` 
          });
        }
      } else if (currentSession) {
        // Create new project (legacy mode)
        const response = await apiService.saveFromEditor({
          session_id: currentSession.sessionId,
          html_content: htmlContent,
          project_name: `Website_${currentSession.sessionId.slice(0, 8)}`,
          description: `Website saved from editor on ${new Date().toLocaleDateString()}`,
          auto_save: false
        });

        if (response.success) {
          setOriginalHtmlContent(htmlContent);
          setMessage({ 
            type: 'success', 
            text: `Project "${response.project_name}" saved successfully to database` 
          });
          
          // Also save to conversation history for backward compatibility
          await saveToMongoDB(htmlContent);
        }
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save website' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowExitModal(true);
    } else {
      router.push(path);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      
      // Save the current state before exiting
      if (currentProject) {
        // Update existing project
        const response = await apiService.updateProject(currentProject.project_id, {
          html_content: htmlContent,
          project_name: currentProject.project_name
        });
        
        if (response.success) {
          console.log(`✅ Project "${currentProject.project_name}" saved before exit`);
        }
      } else if (currentSession) {
        // Create new project (legacy mode)
        const response = await apiService.saveFromEditor({
          session_id: currentSession.sessionId,
          html_content: htmlContent,
          project_name: `Website_${currentSession.sessionId.slice(0, 8)}_Exit`,
          description: `Website saved before exiting editor on ${new Date().toLocaleDateString()}`,
          auto_save: false
        });
        
        if (response.success) {
          console.log(`✅ Project saved before exit: ${response.project_name}`);
        }
      }
      
      const targetPath = pendingNavigation || '/dashboard';
      router.push(targetPath);
    } catch (error) {
      console.error('Failed to save before exit:', error);
      // Still exit even if save fails, user chose to save
      const targetPath = pendingNavigation || '/dashboard';
      router.push(targetPath);
    } finally {
      setIsSaving(false);
      setShowExitModal(false);
      setPendingNavigation(null);
    }
  };

  const handleExitWithoutSaving = () => {
    const targetPath = pendingNavigation || '/dashboard';
    router.push(targetPath);
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const handleUndo = async () => {
    if (!currentSession || !canUndo) return;
    
    try {
      const response = await apiService.undoEdit({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        updateCurrentHtml(response.html_content, 'undo');
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        setMessage({ type: 'success', text: 'Change undone' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to undo change' });
    }
  };

  const handleRedo = async () => {
    if (!currentSession || !canRedo) return;
    
    try {
      const response = await apiService.redoEdit({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        updateCurrentHtml(response.html_content, 'redo');
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        setMessage({ type: 'success', text: 'Change redone' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to redo change' });
    }
  };

  const handleDownload = () => {
    if (!currentSession) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-${currentSession.sessionId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Website downloaded successfully' });
  };

  const handleOpenInNewTab = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    if (newWindow) {
      setMessage({ type: 'success', text: 'Website opened in new tab' });
    } else {
      setMessage({ type: 'error', text: 'Failed to open new tab. Please check popup blocker settings.' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
  };

  const handleIntelligentSuggestion = (suggestion: string) => {
    setEditCommand(suggestion);
    setBaseEditCommand(suggestion);
    setIntelligentResponse(null);
  };

  const handleIntelligentOption = (option: string) => {
    if (intelligentResponse?.original_command) {
      const refinedCommand = `${intelligentResponse.original_command} - specifically the ${option.toLowerCase()}`;
      setEditCommand(refinedCommand);
      setBaseEditCommand(refinedCommand);
    } else {
      setEditCommand(option);
      setBaseEditCommand(option);
    }
    setIntelligentResponse(null);
  };

  const handleProjectNameEdit = () => {
    if (currentProject) {
      setIsEditingProjectName(true);
    }
  };

  const handleProjectNameSave = async () => {
    if (!currentProject || !projectNameInput.trim()) {
      setIsEditingProjectName(false);
      setProjectNameInput(currentProject?.project_name || '');
      return;
    }

    try {
      const response = await apiService.updateProject(currentProject.project_id, {
        project_name: projectNameInput.trim()
      });

      if (response.success) {
        setCurrentProject(prev => prev ? {
          ...prev,
          project_name: projectNameInput.trim()
        } : null);
        setIsEditingProjectName(false);
        setMessage({ 
          type: 'success', 
          text: 'Project name updated successfully' 
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to update project name' });
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      setMessage({ type: 'error', text: 'Failed to update project name' });
    }
  };

  const handleProjectNameCancel = () => {
    setIsEditingProjectName(false);
    setProjectNameInput(currentProject?.project_name || '');
  };

  const handleProjectNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProjectNameSave();
    } else if (e.key === 'Escape') {
      handleProjectNameCancel();
    }
  };

  // Show loading screen while authentication is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h3>
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the editor</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading or no session/project error
  if (!currentSession && !currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Editor...</h3>
            <p className="text-gray-600">Preparing your workspace...</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Found</h2>
            <p className="text-gray-600 mb-6">Please select a project to edit or generate a new website</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
          <button
              onClick={() => handleNavigation('/dashboard')}
              className={clsx(
                "p-2 rounded-lg border transition-all duration-300 relative",
                hasUnsavedChanges
                  ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
                  : "bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600"
              )}
              title={hasUnsavedChanges ? "Back to Dashboard (unsaved changes)" : "Back to Dashboard"}
          >
            <ArrowLeft className="w-4 h-4" />
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse"></div>
            )}
          </button>
          
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                {currentProject ? (
                  <div className="flex items-center gap-2">
                    {isEditingProjectName ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={projectNameInput}
                          onChange={(e) => setProjectNameInput(e.target.value)}
                          onKeyPress={handleProjectNameKeyPress}
                          onBlur={handleProjectNameSave}
                          className="text-lg font-bold text-black bg-transparent border-b-2 border-purple-500 focus:outline-none focus:border-pink-500 min-w-0 max-w-48"
                          autoFocus
                          maxLength={50}
                        />
                        <button
                          onClick={handleProjectNameSave}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Save name"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleProjectNameCancel}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={handleProjectNameEdit}
                        title="Click to edit project name"
                      >
                        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-200">
                          {currentProject.project_name}
                        </h1>
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 rounded text-xs font-medium">
                      <span>v{currentProject.mode === 'edit' ? 'Editing' : 'Viewing'}</span>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                    Website Editor
                  </h1>
                )}
              </div>
            </div>
        </div>

          {/* Center Section - Tools */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg">
          <button
            onClick={handleUndo}
            disabled={!canUndo || isEditing}
                className={clsx(
                  "p-2 transition-all duration-300",
                  canUndo && !isEditing
                    ? "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
                    : "text-gray-400 cursor-not-allowed"
                )}
                title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo || isEditing}
                className={clsx(
                  "p-2 transition-all duration-300",
                  canRedo && !isEditing
                    ? "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
                    : "text-gray-400 cursor-not-allowed"
                )}
                title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

          {/* View Mode Toggle */}
            <div className="flex items-center bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg">
            <button
              onClick={() => setViewMode('preview')}
              className={clsx(
                  "px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 text-sm font-medium",
                  viewMode === 'preview'
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
                )}
            >
              <Eye className="w-4 h-4" />
                Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={clsx(
                  "px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 text-sm font-medium",
                  viewMode === 'code'
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
                )}
            >
              <Code className="w-4 h-4" />
                Code
            </button>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInNewTab}
              className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
              title="Open in New Tab"
          >
            <Maximize className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
              className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
            title="Download HTML"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
              Save
          </button>
          </div>
        </div>
      </header>

      {/* Status Message */}
      {message && (
        <div className={clsx(
          'mx-4 mt-2 px-4 py-2 rounded-lg border flex items-center gap-2 shadow-sm backdrop-blur-sm text-sm',
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-600 border-green-500/30' 
            : 'bg-red-500/10 text-red-600 border-red-500/30'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content - Compact Layout */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Preview Section - 70% */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Preview Header - Compact */}
          <div className="px-4 py-2 bg-gradient-to-r from-white/80 to-gray-50/80 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-gray-900">
                {viewMode === 'preview' ? 'Live Preview' : 'Source Code'}
              </span>
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 rounded text-xs font-medium">
                <Zap className="w-3 h-3" />
                Real-time
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-3">
            <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative">
              {viewMode === 'preview' ? (
                <>
                  {isPreviewLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}
                <iframe
                    key={iframeKey}
                    ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                  title="Website Preview"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                    onLoad={() => {
                      setIsPreviewLoading(false);
                    }}
                    onError={() => {
                      setIsPreviewLoading(false);
                      console.warn('Iframe failed to load, attempting refresh');
                      // Try to refresh the iframe after a brief delay
                      setTimeout(() => {
                        if (iframeRef.current) {
                          setIframeKey(prev => prev + 1);
                        }
                      }, 500);
                    }}
                  />
                </>
              ) : (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full h-full p-3 bg-gray-50 text-gray-900 border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono"
                  style={{ 
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Chat Panel - 30% - Modern Design */}
        <div className="w-80 flex flex-col bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Chat Header - Modern */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
              </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-white/80">Voice Enabled</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Active
              </div>
            </div>
          </div>

          {/* Chat Messages - Compact */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50/50">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Welcome!</h4>
                <p className="text-gray-600 text-xs">Tell me what you'd like to change about your website.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={clsx(
                    "flex gap-2",
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {msg.type === 'ai' && (
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-white" />
                        </div>
                    )}
                    <div className={clsx(
                      "max-w-[85%] rounded-lg p-2",
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    )}>
                      {msg.type === 'ai' && msg.intelligentResponse ? (
                            <ClientOnly>
                              <IntelligentResponseComponent
                                response={msg.intelligentResponse}
                                onSuggestionClick={handleIntelligentSuggestion}
                                onOptionClick={handleIntelligentOption}
                              />
                            </ClientOnly>
                          ) : (
                        <p className="text-xs">{msg.content}</p>
                          )}
                        </div>
                    {msg.type === 'user' && (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                                 )}
                 <div ref={messagesEndRef} />
               </div>
             )}
          </div>

          {/* Chat Input - Modern Design */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400">
              <textarea
                ref={editCommandRef}
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change..."
                className={clsx(
                  'flex-1 bg-transparent border-0 text-gray-900 placeholder-gray-500 text-sm resize-none focus:outline-none min-h-[20px] max-h-[60px]',
                  isVoiceActive && 'text-purple-600'
                )}
                disabled={isEditing}
                rows={1}
              />
              <div className="flex items-center gap-1">
                <ChatVoiceButton
                  onTranscript={handleVoiceCommand}
                  onInterimTranscript={handleInterimVoiceCommand}
                  disabled={isEditing}
                />
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editCommand.trim()}
                  className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isEditing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onSave={handleSaveAndExit}
        onExit={handleExitWithoutSaving}
        onCancel={handleCancelExit}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        exitDestination={pendingNavigation === '/dashboard' ? 'Dashboard' : 'Previous Page'}
      />
    </div>
  );
} 