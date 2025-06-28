'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  User,
  Send
} from 'lucide-react';
import { VoiceButton } from '../../components/VoiceButton';
import { ClientOnly } from '../../components/ClientOnly';
import { IntelligentResponseComponent } from '../../components/IntelligentResponse';
import { apiService, IntelligentResponse } from '../../services/api';
import { useSessionStorage } from '../../hooks/useSessionStorage';
import clsx from 'clsx';

export default function EditorPage() {
  const router = useRouter();
  const { currentSession, updateCurrentHtml } = useSessionStorage();

  const [htmlContent, setHtmlContent] = useState('');
  const [editCommand, setEditCommand] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

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
  const editCommandRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Session validation function
  const validateSession = useCallback(async () => {
    if (!currentSession) return false;
    
    try {
      // Try a simple health check with session info
      await apiService.healthCheck();
      return true;
    } catch (err: any) {
      console.warn('Session validation failed:', err);
      return false;
    }
  }, [currentSession]);

  // Initialize HTML content from session
  useEffect(() => {
    if (currentSession) {
      setHtmlContent(currentSession.htmlContent);
      setIsLoading(false);
    } else {
      // Give a brief moment for session to load from storage
      const timer = setTimeout(() => {
        if (!currentSession) {
          // Redirect to home if no session after timeout
          router.push('/');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentSession, router]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && !isEditing) {
          handleUndo();
        }
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo && !isEditing) {
          handleRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, isEditing]);

  // Auto-recovery for expired sessions
  useEffect(() => {
    if (currentSession && htmlContent) {
      const checkSession = async () => {
        const isValid = await validateSession();
        if (!isValid) {
          console.warn('Session appears to be invalid, but continuing with local data');
          // For now, just warn but don't auto-redirect since user might have unsaved work
        }
      };
      
      // Check session validity after a delay (only once per session)
      const timer = setTimeout(checkSession, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentSession?.sessionId, validateSession, htmlContent]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isEditing]);

  const handleVoiceCommand = useCallback((transcript: string) => {
    // Final transcript - replace the interim part with final
    const finalText = baseEditCommand + transcript;
    setEditCommand(finalText);
    setBaseEditCommand(finalText);
    setIsVoiceActive(false);
  }, [baseEditCommand]);

  const handleInterimVoiceCommand = useCallback((transcript: string) => {
    // Interim transcript - show real-time updates
    setEditCommand(baseEditCommand + transcript);
    setIsVoiceActive(true);
  }, [baseEditCommand]);

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
    
    // Clear intelligent response when user manually edits
    if (intelligentResponse && !isVoiceActive) {
      setIntelligentResponse(null);
    }
  };

  const handleEdit = async () => {
    if (!editCommand.trim() || !currentSession) {
      setMessage({ type: 'error', text: 'Please enter an edit command or use voice input' });
      return;
    }

    // Add user message to conversation
    const userMessage = {
      type: 'user' as const,
      content: editCommand.trim(),
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);

    setIsEditing(true);
    setMessage(null);
    setIntelligentResponse(null); // Clear any previous intelligent response

    try {
      const response = await apiService.editWebsite({
        html_content: htmlContent,
        edit_command: editCommand.trim(),
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        updateCurrentHtml(response.html_content, 'edit', editCommand.trim());
        
        // After successful edit, enable undo and clear redo
        setCanUndo(true);
        setCanRedo(false);
        
        // Add AI response to conversation
        const aiMessage = {
          type: 'ai' as const,
          content: response.intelligent_response?.message || `Successfully applied: ${response.changes_made.join(', ')}`,
          timestamp: new Date(),
          intelligentResponse: response.intelligent_response
        };
        setConversationHistory(prev => [...prev, aiMessage]);
        
        // Handle intelligent response
        if (response.intelligent_response) {
          setIntelligentResponse(response.intelligent_response);
          setMessage(null); // Clear basic message since we have intelligent response
        } else {
          setMessage({ 
            type: 'success', 
            text: `Successfully applied: ${response.changes_made.join(', ')}` 
          });
        }
        
        // Only clear command if it's a confirmation (not clarification)
        if (!response.intelligent_response || response.intelligent_response.type === 'confirmation') {
          setEditCommand('');
          setBaseEditCommand('');
        }
      } else {
        // Add error response to conversation
        const errorMessage = {
          type: 'ai' as const,
          content: response.message || 'Failed to edit website',
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, errorMessage]);
        setMessage({ type: 'error', text: response.message || 'Failed to edit website' });
        setIntelligentResponse(null);
      }
    } catch (err: any) {
      console.error('Edit error:', err);
      
      // Add error response to conversation
      const errorMessage = {
        type: 'ai' as const,
        content: err.message && err.message.includes('Session') ? 'Session expired. Please generate a new website or refresh the page.' : 'Failed to edit website',
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
      
      // Handle session not found error specifically
      if (err.message && err.message.includes('Session') && err.message.includes('not found')) {
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please generate a new website or refresh the page.' 
        });
        
        // Optionally redirect to home after a delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
      setMessage({ type: 'error', text: err.message || 'Failed to edit website' });
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = async () => {
    if (!currentSession || !canUndo || isEditing) return;

    try {
      setMessage(null); // Clear any existing messages
      const response = await apiService.undoChange({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        updateCurrentHtml(response.html_content, 'undo', 'Undo change');
        setMessage({ type: 'success', text: 'Change undone successfully' });
        
        // Clear any intelligent response when undoing
        setIntelligentResponse(null);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to undo change' });
      }
    } catch (err: any) {
      console.error('Undo error:', err);
      
      // Handle session not found error specifically
      if (err.message && err.message.includes('Session') && err.message.includes('not found')) {
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please generate a new website or refresh the page.' 
        });
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
      setMessage({ type: 'error', text: err.message || 'Failed to undo change' });
      }
    }
  };

  const handleRedo = async () => {
    if (!currentSession || !canRedo || isEditing) return;

    try {
      setMessage(null); // Clear any existing messages
      const response = await apiService.redoChange({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        updateCurrentHtml(response.html_content, 'redo', 'Redo change');
        setMessage({ type: 'success', text: 'Change redone successfully' });
        
        // Clear any intelligent response when redoing
        setIntelligentResponse(null);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to redo change' });
      }
    } catch (err: any) {
      console.error('Redo error:', err);
      
      // Handle session not found error specifically
      if (err.message && err.message.includes('Session') && err.message.includes('not found')) {
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please generate a new website or refresh the page.' 
        });
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
      setMessage({ type: 'error', text: err.message || 'Failed to redo change' });
      }
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
        setMessage({ type: 'success', text: `Website saved as ${response.filename}` });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      
      // Handle session not found error specifically
      if (err.message && err.message.includes('Session') && err.message.includes('not found')) {
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please generate a new website or refresh the page.' 
        });
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
      setMessage({ type: 'error', text: err.message || 'Failed to save website' });
      }
    } finally {
      setIsSaving(false);
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

    // Create a blob URL for the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    const newWindow = window.open(url, '_blank');
    
    // Clean up the URL after a delay to prevent memory leaks
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
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
    setIntelligentResponse(null); // Clear the response
  };

  const handleIntelligentOption = (option: string) => {
    // For clarification options, we refine the original command
    if (intelligentResponse?.original_command) {
      const refinedCommand = `${intelligentResponse.original_command} - specifically the ${option.toLowerCase()}`;
      setEditCommand(refinedCommand);
      setBaseEditCommand(refinedCommand);
    } else {
      setEditCommand(option);
      setBaseEditCommand(option);
    }
    setIntelligentResponse(null); // Clear the response
  };

  const handleIntelligentEdit = (newCommand: string) => {
    setEditCommand(newCommand);
    setBaseEditCommand(newCommand);
    setIntelligentResponse(null); // Clear the response
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400 opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400 opacity-8 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {isLoading ? (
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg text-center">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Editor...</h3>
              <p className="text-gray-600">Preparing your workspace...</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex items-center justify-center min-h-screen">
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
          </div>
        )}
      </div>
    );
  }

  return (
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                    Website Editor
                  </h1>
                  <p className="text-xs text-gray-600">AI-Powered</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Undo/Redo */}
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo || isEditing}
                  className={clsx(
                    "p-2 rounded-lg transition-all duration-300 flex items-center gap-2",
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
                    "p-2 rounded-lg transition-all duration-300 flex items-center gap-2",
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
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('preview')}
                  className={clsx(
                    "px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium",
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
                    "px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium",
                    viewMode === 'code'
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
                  )}
                >
                  <Code className="w-4 h-4" />
                  Code
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleOpenInNewTab}
                className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
                title="Open in New Tab"
              >
                <Maximize className="w-5 h-5" />
              </button>

              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-white/80 border border-gray-300 text-gray-700 hover:bg-white hover:border-purple-400 hover:text-purple-600 transition-all duration-300"
                title="Download HTML"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
        </div>
      </header>

      {/* Status Message */}
      {message && (
        <div className={clsx(
          'relative z-10 mx-6 mt-4 px-6 py-4 rounded-xl border flex items-center gap-4 shadow-lg backdrop-blur-sm',
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-600 border-green-500/30 shadow-green-500/20' 
            : 'bg-red-500/10 text-red-600 border-red-500/30 shadow-red-500/20'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex gap-6 p-6 h-[calc(100vh-140px)]">
        {/* Preview Section - 70% */}
        <div className="flex flex-col bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg overflow-hidden" style={{ width: '70%' }}>
          {/* Preview Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-white/80 to-gray-50/80 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-lg text-gray-900">
                {viewMode === 'preview' ? 'Live Preview' : 'Source Code'}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 rounded-lg text-sm font-medium">
                <Zap className="w-4 h-4" />
                Real-time
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4">
            <div className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {viewMode === 'preview' ? (
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                  title="Website Preview"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                />
              ) : (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full h-full p-4 bg-gray-50 text-gray-900 border-0 resize-none focus:outline-none text-sm leading-relaxed font-mono"
                  style={{ 
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - 30% */}
        <div className="flex flex-col bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg overflow-hidden" style={{ width: '30%' }}>
          {/* Chat Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-white/80 to-gray-50/80 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI Assistant</h3>
                  <p className="text-xs text-gray-600">Voice Enabled</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Mic className="w-3 h-3" />
                Active
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Welcome to AI Editor!</h4>
                <p className="text-gray-600 text-sm">Start by telling me what you'd like to change about your website.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={clsx(
                    "flex gap-3",
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={clsx(
                      "max-w-[85%] rounded-xl p-3",
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    )}>
                      {msg.type === 'ai' && msg.intelligentResponse ? (
                        <ClientOnly>
                          <IntelligentResponseComponent
                            response={msg.intelligentResponse}
                            onSuggestionClick={handleIntelligentSuggestion}
                            onOptionClick={handleIntelligentOption}
                            onEditResponse={handleIntelligentEdit}
                          />
                        </ClientOnly>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.type === 'user' && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="bg-gray-100 rounded-xl p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl p-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20">
              <textarea
                ref={editCommandRef}
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change..."
                className={clsx(
                  'flex-1 bg-transparent border-0 text-gray-900 placeholder-gray-500 text-sm resize-none focus:outline-none min-h-[20px] max-h-[80px]',
                  isVoiceActive && 'text-purple-600'
                )}
                disabled={isEditing}
                rows={1}
              />
              <div className="flex items-center gap-2">
                <VoiceButton
                  onTranscript={handleVoiceCommand}
                  onInterimTranscript={handleInterimVoiceCommand}
                  size="sm"
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
    </div>
  );
} 