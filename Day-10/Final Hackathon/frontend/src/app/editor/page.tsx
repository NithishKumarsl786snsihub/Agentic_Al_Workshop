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
  Volume2
} from 'lucide-react';
import { VoiceButton } from '../../components/VoiceButton';
import { ClientOnly } from '../../components/ClientOnly';
import { IntelligentResponseComponent } from '../../components/IntelligentResponse';
import { apiService, IntelligentResponse } from '../../services/api';
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

// Save Confirmation Modal Component
const SaveConfirmationModal: React.FC<{
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}> = ({ isOpen, onSave, onDiscard, onCancel, isSaving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Save Changes?</h3>
          <p className="text-gray-600 mb-6">Do you want to save your changes before exiting?</p>
          
          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={onDiscard}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
            >
              Don't Save
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          
          {!isSaving && (
            <p className="text-xs text-gray-500 mt-3">
              Unsaved changes will be lost if you choose "Don't Save"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [showSaveModal, setShowSaveModal] = useState(false);
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
    setHasUnsavedChanges(htmlContent !== originalHtmlContent);
  }, [htmlContent, originalHtmlContent]);

  // Initialize HTML content from session or MongoDB - ONLY after authentication is ready
  useEffect(() => {
    const initializeContent = async () => {
      // Wait for authentication to be fully initialized
      if (authLoading) {
        console.log('🔄 Waiting for authentication to initialize...');
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('🚫 User not authenticated, redirecting to login...');
        router.push('/auth/login');
        return;
      }

      // Wait for session storage to be ready (it takes a moment to load from localStorage)
      if (!currentSession) {
        console.log('⏳ Waiting for session data to load...');
        // Give session storage more time to initialize
        return;
      }

      // Now we have both auth and session data - proceed with initialization
      console.log('📝 Initializing editor with session:', currentSession.sessionId);
      console.log('👤 User authenticated:', user?.username);
      
      try {
      setHtmlContent(currentSession.htmlContent);
        setOriginalHtmlContent(currentSession.htmlContent);
        
        // Load from MongoDB if available - with proper error handling
        try {
          console.log('🔄 Loading session from MongoDB...');
          const sessionData = await apiService.getSessionHistory(currentSession.sessionId);
          if (sessionData.success && sessionData.html_content) {
            console.log('✅ Session loaded from MongoDB');
            setHtmlContent(sessionData.html_content);
            setOriginalHtmlContent(sessionData.html_content);
    } else {
            console.log('ℹ️ Using local session data (MongoDB data not available)');
          }
        } catch (error) {
          console.warn('⚠️ Could not load session from MongoDB, using local data:', error);
          // Don't throw error, just use local data
        }
        
        setIsLoading(false);
        console.log('✅ Editor initialization complete');
      } catch (error) {
        console.error('❌ Error during editor initialization:', error);
        setIsLoading(false);
        setMessage({ type: 'error', text: 'Failed to initialize editor' });
      }
    };

    // Add a small delay to ensure session storage has time to load
    const initTimer = setTimeout(() => {
      initializeContent();
    }, 100);

    return () => clearTimeout(initTimer);
  }, [currentSession, router, authLoading, isAuthenticated, user]);

  // Additional effect to handle the case where we're still waiting for session after auth is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated && !currentSession && !isLoading) {
      console.log('⚠️ Auth ready but no session found, redirecting to home...');
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 2000); // Wait 2 seconds for session to potentially load
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authLoading, isAuthenticated, currentSession, isLoading, router]);

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

  // Handle browser/tab close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    if (!currentSession) return;

    setIsSaving(true);
    try {
      const response = await apiService.saveWebsite({
        html_content: htmlContent,
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setOriginalHtmlContent(htmlContent);
        await saveToMongoDB(htmlContent);
        setMessage({ type: 'success', text: `Website saved as ${response.filename}` });
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
      setShowSaveModal(true);
      } else {
      router.push(path);
    }
  };

  const handleSaveAndNavigate = async () => {
    await handleSave();
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowSaveModal(false);
    setPendingNavigation(null);
  };

  const handleDiscardAndNavigate = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowSaveModal(false);
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

  // Show loading or no session error
  if (!currentSession) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Session Found</h2>
            <p className="text-gray-600 mb-6">Please generate a website first</p>
                <button
                  onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
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
              className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                  Website Editor
                </h1>
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

      {/* Save Confirmation Modal */}
      <SaveConfirmationModal
        isOpen={showSaveModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={() => {
          setShowSaveModal(false);
          setPendingNavigation(null);
        }}
        isSaving={isSaving}
      />
    </div>
  );
} 