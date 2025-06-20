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
  Zap
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
      <div className="main-container">
        {isLoading ? (
          <div className="content-wrapper">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <h3 className="text-title mb-4">Loading Editor...</h3>
              <p className="text-body text-[var(--color-text-secondary)]">
                Preparing your workspace...
              </p>
            </div>
          </div>
        ) : (
          <div className="content-wrapper">
            <div className="content-card">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-title mb-2">No Session Found</h2>
                <p className="text-body text-[var(--color-text-secondary)] mb-6">
                  Please generate a website first
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn btn-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(
      'min-h-screen bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-alt)] flex flex-col',
    )}>
      {/* Professional IDE-Style Header */}
      <header className="ide-header">
        <style jsx>{`
          .ide-header {
            background: #1e1e1e;
            border-bottom: 1px solid #2d2d2d;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 56px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          .header-center {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .back-button {
            background: transparent;
            border: none;
            color: #cccccc;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .back-button:hover {
            background: #2d2d2d;
            color: #ffffff;
          }
          
          .traffic-lights {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-right: 12px;
          }
          
          .traffic-light {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          
          .traffic-light.red { background: #ff5f57; }
          .traffic-light.yellow { background: #ffbd2e; }
          .traffic-light.green { background: #28ca42; }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .logo-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
          }
          
          .ai-badge-clean {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .action-button {
            background: transparent;
            border: 1px solid #404040;
            color: #cccccc;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            height: 32px;
            position: relative;
          }
          
          .action-button:hover:not(:disabled) {
            background: #2d2d2d;
            border-color: #10b981;
            color: #ffffff;
          }
          
          .action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .action-button.active {
            background: #10b981;
            border-color: #10b981;
            color: white;
          }
          
          .primary-save-button {
            background: #10b981;
            border: 1px solid #10b981;
            color: white;
            padding: 6px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 600;
            height: 32px;
          }
          
          .primary-save-button:hover:not(:disabled) {
            background: #0d9968;
            border-color: #0d9968;
          }
          
          .primary-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .button-group-clean {
            display: flex;
            align-items: center;
            background: #2d2d2d;
            border-radius: 6px;
            padding: 2px;
            gap: 2px;
          }
          
          .tooltip {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e1e1e;
            color: #cccccc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 1000;
            border: 1px solid #404040;
          }
          
          .action-button:hover .tooltip {
            opacity: 1;
          }
        `}</style>
        
        <div className="header-left">
          {/* Traffic Lights & Back Button */}
          <div className="traffic-lights">
            <div className="traffic-light red"></div>
            <div className="traffic-light yellow"></div>
            <div className="traffic-light green"></div>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="back-button"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-title">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span>Website Editor</span>
            </div>
            <div className="ai-badge-clean">
              AI Assistant
            </div>
          </div>
        </div>

        <div className="header-center">
          {/* Undo/Redo Buttons */}
          <button
            onClick={handleUndo}
            disabled={!canUndo || isEditing}
            className="action-button"
            title={canUndo ? "Undo (Ctrl+Z)" : "No changes to undo"}
          >
            <Undo2 className="w-4 h-4" />
            <div className="tooltip">Ctrl+Z</div>
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo || isEditing}
            className="action-button"
            title={canRedo ? "Redo (Ctrl+Shift+Z)" : "No changes to redo"}
          >
            <Redo2 className="w-4 h-4" />
            <div className="tooltip">Ctrl+Shift+Z</div>
          </button>
        </div>

        <div className="header-right">
          {/* View Mode Toggle */}
          <div className="button-group-clean">
            <button
              onClick={() => setViewMode('preview')}
              className={clsx(
                'action-button',
                viewMode === 'preview' && 'active'
              )}
              style={{ border: 'none', height: '28px' }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={clsx(
                'action-button',
                viewMode === 'code' && 'active'
              )}
              style={{ border: 'none', height: '28px' }}
            >
              <Code className="w-4 h-4" />
              <span>Code</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleOpenInNewTab}
            className="action-button"
            title="Open Preview in New Tab"
          >
            <Maximize className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="action-button"
            title="Download HTML"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="primary-save-button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Enhanced Status Message */}
      {message && (
        <div className={clsx(
          'mx-8 mt-4 px-6 py-4 rounded-xl border flex items-center gap-4 shadow-lg backdrop-blur-sm',
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-green-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/20'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
          <span className="font-semibold text-lg">{message.text}</span>
        </div>
      )}

      {/* Main Layout with Enhanced Spacing */}
      <div className="flex-1 flex min-h-0 gap-6 p-6">
        {/* Preview Section - 70% with enhanced styling */}
        <div className="flex flex-col bg-[var(--color-surface)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden" style={{ width: '70%' }}>
          {/* Preview Header - Enhanced */}
          <div className="bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-bg-alt)] px-8 py-6 flex items-center justify-between border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-[var(--color-accent)] rounded-full animate-pulse shadow-lg"></div>
              <span className="font-bold text-xl text-[var(--color-text)]">Live Preview</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-xl text-sm font-semibold">
                <Zap className="w-4 h-4" />
                Real-time
              </div>
            </div>
            <div className="text-lg text-[var(--color-text-secondary)] font-semibold">
              {viewMode === 'preview' ? 'Rendered View' : 'Source Code'}
            </div>
          </div>

          {/* Preview Content - Enhanced */}
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-2xl border-2 border-[var(--color-border)] overflow-hidden shadow-2xl">
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
                  className="w-full h-full p-8 bg-[var(--color-bg)] text-[var(--color-text)] border-0 resize-none focus:outline-none text-base leading-relaxed"
                  style={{ 
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Chatbot Assistant Panel */}
        <div className="chatbot-panel" style={{ width: '30%' }}>
          <style jsx>{`
            .chatbot-panel {
              background: #1a1a1a;
              border-radius: 16px;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              border: 1px solid #2d2d2d;
              height: 100%;
              max-height: calc(100vh - 120px);
            }
            
            .chatbot-header {
              background: #1a1a1a;
              padding: 12px 16px;
              border-bottom: 1px solid #2d2d2d;
            }
            
            .chatbot-header-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            
            .chatbot-title {
              display: flex;
              align-items: center;
              gap: 12px;
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;
            }
            
            .voice-badge {
              background: #10b981;
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            
            .chat-messages-area {
              flex: 1;
              padding: 8px 12px;
              overflow-y: auto;
              overflow-x: hidden;
              display: flex;
              flex-direction: column;
              gap: 8px;
              min-height: 0;
              max-height: calc(100vh - 300px);
            }
            
            .chat-messages-area::-webkit-scrollbar {
              width: 6px;
            }
            
            .chat-messages-area::-webkit-scrollbar-track {
              background: #1a1a1a;
              border-radius: 3px;
            }
            
            .chat-messages-area::-webkit-scrollbar-thumb {
              background: #404040;
              border-radius: 3px;
            }
            
            .chat-messages-area::-webkit-scrollbar-thumb:hover {
              background: #10b981;
            }
            
            .welcome-message {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 20px 12px;
              min-height: 200px;
              flex: 1;
            }
            
            .welcome-avatar {
              width: 40px;
              height: 40px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
            }
            
            .welcome-text h3 {
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            
            .welcome-text p {
              color: #cccccc;
              font-size: 13px;
              line-height: 1.4;
              max-width: 280px;
            }
            
            .conversation-messages {
              display: flex;
              flex-direction: column;
              gap: 8px;
              flex: 1;
              padding-bottom: 8px;
            }
            
            .message-bubble {
              display: flex;
              width: 100%;
            }
            
            .message-bubble.user {
              justify-content: flex-end;
            }
            
            .message-bubble.ai {
              justify-content: flex-start;
            }
            
            .user-message {
              display: flex;
              align-items: flex-end;
              gap: 6px;
              max-width: 85%;
            }
            
            .user-avatar {
              width: 28px;
              height: 28px;
              background: #404040;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              font-size: 10px;
              color: #ffffff;
              font-weight: 600;
            }
            
            .user-bubble {
              background: #10b981;
              color: white;
              padding: 8px 12px;
              border-radius: 16px 16px 4px 16px;
              font-size: 14px;
              line-height: 1.4;
              word-wrap: break-word;
            }
            
            .ai-message {
              display: flex;
              align-items: flex-start;
              gap: 6px;
              max-width: 90%;
            }
            
            .ai-avatar {
              width: 28px;
              height: 28px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 4px;
            }
            
            .ai-bubble {
              background: #2d2d2d;
              border-radius: 16px 16px 16px 4px;
              overflow: hidden;
            }
            
            .simple-ai-message {
              padding: 8px 12px;
            }
            
            .ai-label {
              font-size: 12px;
              font-weight: 600;
              color: #10b981;
              margin-bottom: 4px;
            }
            
            .ai-content {
              color: #e5e5e5;
              font-size: 14px;
              line-height: 1.4;
            }
            
            .typing-indicator {
              padding: 8px 12px;
              display: flex;
              gap: 4px;
              align-items: center;
            }
            
            .typing-indicator span {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
              animation: typing 1.4s infinite;
            }
            
            .typing-indicator span:nth-child(2) {
              animation-delay: 0.2s;
            }
            
            .typing-indicator span:nth-child(3) {
              animation-delay: 0.4s;
            }
            
            @keyframes typing {
              0%, 60%, 100% {
                transform: translateY(0);
              }
              30% {
                transform: translateY(-10px);
              }
            }
            
            .chat-input-bottom {
              border-top: 1px solid #2d2d2d;
              padding: 8px 12px;
              background: #1a1a1a;
              flex-shrink: 0;
              position: sticky;
              bottom: 0;
              z-index: 10;
            }
            
            .input-container {
              display: flex;
              align-items: center;
              gap: 8px;
              background: #0f1419;
              border: 2px solid #2d2d2d;
              border-radius: 24px;
              padding: 4px 6px 4px 12px;
              transition: all 0.2s ease;
            }
            
            .input-container:focus-within {
              border-color: #10b981;
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
            }
            
            .chat-input {
              flex: 1;
              background: transparent;
              border: none;
              color: #cccccc;
              font-size: 14px;
              line-height: 1.3;
              resize: none;
              outline: none;
              min-height: 18px;
              max-height: 80px;
              padding: 6px 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .chat-input::placeholder {
              color: #6b7280;
            }
            
            .chat-input.voice-active {
              color: #10b981;
            }
            
            .input-actions {
              display: flex;
              gap: 4px;
              align-items: center;
            }
            
            .send-button {
              width: 28px;
              height: 28px;
              background: #10b981;
              border: none;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              color: white;
              flex-shrink: 0;
            }
            
            .send-button:hover:not(:disabled) {
              background: #0d9968;
              transform: scale(1.05);
            }
            
            .send-button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }

            .chatbot-input-section {
              padding: 24px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            
            .input-label {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #cccccc;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 16px;
            }
            
            .chat-input-container {
              position: relative;
              flex: 1;
              margin-bottom: 16px;
            }
            
            .chat-textarea {
              width: 100%;
              min-height: 320px;
              background: #0f1419;
              border: 2px solid #2d2d2d;
              border-radius: 12px;
              padding: 20px;
              color: #cccccc;
              font-size: 14px;
              line-height: 1.5;
              resize: none;
              transition: all 0.2s ease;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .chat-textarea:focus {
              outline: none;
              border-color: #10b981;
              background: #0a0e13;
            }
            
            .chat-textarea.voice-active {
              border-color: #10b981;
              background: #0a0e13;
              box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }
            
            .chat-textarea::placeholder {
              color: #6b7280;
              font-size: 14px;
            }
            
            .voice-button-container {
              position: absolute;
              bottom: 16px;
              right: 16px;
            }
            
            .chat-submit-container {
              display: flex;
              gap: 12px;
              align-items: center;
            }
            
            .voice-button-main {
              background: #10b981;
              border: none;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              flex-shrink: 0;
            }
            
            .voice-button-main:hover {
              background: #0d9968;
              transform: scale(1.05);
            }
            
            .chat-submit-button {
              background: #10b981;
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 24px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              flex: 1;
              justify-content: center;
              height: 48px;
            }
            
            .chat-submit-button:hover:not(:disabled) {
              background: #0d9968;
              transform: translateY(-1px);
            }
            
            .chat-submit-button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }
            
            .chat-response-container {
              background: #141414;
              border-top: 1px solid #2d2d2d;
              padding: 20px 24px;
              max-height: 200px;
              overflow-y: auto;
            }
            
            .chat-message {
              background: #2d2d2d;
              border-radius: 12px;
              padding: 16px;
              color: #cccccc;
              font-size: 14px;
              line-height: 1.5;
            }
          `}</style>
          
          {/* Chatbot Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-top">
              <div className="chatbot-title">
                <Mic className="w-5 h-5 text-green-400" />
                <span>AI Assistant</span>
              </div>
              <div className="voice-badge">
                Voice Enabled
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="chat-messages-area">
            {conversationHistory.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-avatar">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <div className="welcome-text">
                  <h3>Welcome to AI Website Editor!</h3>
                  <p>Start by telling me what you'd like to change about your website. You can use voice or text input.</p>
                </div>
              </div>
            ) : (
              <div className="conversation-messages">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.type}`}>
                    {msg.type === 'user' ? (
                      <div className="user-message">
                        <div className="user-avatar">
                          <span>You</span>
                        </div>
                        <div className="user-bubble">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="ai-message">
                        <div className="ai-avatar">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="ai-bubble">
                          {msg.intelligentResponse ? (
                            <ClientOnly>
                              <IntelligentResponseComponent
                                response={msg.intelligentResponse}
                                onSuggestionClick={handleIntelligentSuggestion}
                                onOptionClick={handleIntelligentOption}
                                onEditResponse={handleIntelligentEdit}
                              />
                            </ClientOnly>
                          ) : (
                            <div className="simple-ai-message">
                              <div className="ai-label">AI Assistant</div>
                              <div className="ai-content">{msg.content}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="message-bubble ai">
                    <div className="ai-message">
                      <div className="ai-avatar">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                      <div className="ai-bubble">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                                 )}
                 <div ref={messagesEndRef} />
               </div>
             )}
          </div>

          {/* Chat Input at Bottom */}
          <div className="chat-input-bottom">
            <div className="input-container">
              <textarea
                ref={editCommandRef}
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change... e.g., 'change header color to blue', 'add a contact form'"
                className={clsx(
                  'chat-input',
                  isVoiceActive && 'voice-active'
                )}
                disabled={isEditing}
                rows={1}
              />
              <div className="input-actions">
                <VoiceButton
                  onTranscript={handleVoiceCommand}
                  onInterimTranscript={handleInterimVoiceCommand}
                  size="sm"
                  disabled={isEditing}
                />
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editCommand.trim()}
                  className="send-button"
                  title="Send message"
                >
                  {isEditing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
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