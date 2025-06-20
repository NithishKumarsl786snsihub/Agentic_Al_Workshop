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
  Wand2,
  Palette,
  Type,
  ImageIcon,
  Star,
  Settings
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [baseEditCommand, setBaseEditCommand] = useState('');
  const [intelligentResponse, setIntelligentResponse] = useState<IntelligentResponse | null>(null);
  const editCommandRef = React.useRef<HTMLTextAreaElement>(null);

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
        setMessage({ type: 'error', text: response.message || 'Failed to edit website' });
        setIntelligentResponse(null);
      }
    } catch (err: any) {
      console.error('Edit error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to edit website' });
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = async () => {
    if (!currentSession) return;

    try {
      const response = await apiService.undoChange({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        setMessage({ type: 'success', text: 'Change undone successfully' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to undo change' });
    }
  };

  const handleRedo = async () => {
    if (!currentSession) return;

    try {
      const response = await apiService.redoChange({
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        setCanUndo(response.can_undo);
        setCanRedo(response.can_redo);
        setMessage({ type: 'success', text: 'Change redone successfully' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to redo change' });
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
      setMessage({ type: 'error', text: err.message || 'Failed to save website' });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
  };

  const handleQuickCommand = (command: string) => {
    setEditCommand(command);
    setBaseEditCommand(command);
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
      'min-h-screen bg-[var(--color-bg)] flex flex-col',
      { 'fixed inset-0 z-50': isFullscreen }
    )}>
      {/* Professional Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-200"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-[var(--color-accent)] px-4 py-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-[var(--color-bg)]" />
                <span className="text-[var(--color-bg)] font-semibold text-lg">Website Editor</span>
              </div>
              <div className="px-3 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-full text-sm font-medium">
                AI Assistant
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-3 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Undo"
            >
              <Undo2 className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-3 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Redo"
            >
              <Redo2 className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-[var(--color-bg-alt)] rounded-lg border border-[var(--color-border)] mx-2">
              <button
                onClick={() => setViewMode('preview')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-all duration-200',
                  viewMode === 'preview' 
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]'
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r-lg transition-all duration-200',
                  viewMode === 'code' 
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]'
                )}
              >
                <Code className="w-4 h-4" />
                Code
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-200"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleDownload}
              className="p-3 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-200"
              title="Download HTML"
            >
              <Download className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg)] font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
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
          'px-6 py-3 border-b border-[var(--color-border)] flex items-center gap-3',
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Layout with Proper Proportions */}
      <div className="flex-1 flex min-h-0">
        {/* Preview Section - 70% */}
        <div className="flex flex-col" style={{ width: '70%' }}>
          {/* Preview Header */}
          <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
              <span className="font-semibold text-[var(--color-text)]">Live Preview</span>
              <span className="px-3 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-full text-xs font-medium">
                Real-time
              </span>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] font-medium">
              {viewMode === 'preview' ? 'Rendered View' : 'Source Code'}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 bg-[var(--color-bg)]">
            <div className="h-full bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-xl">
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
                  className="w-full h-full p-6 bg-[var(--color-bg)] text-[var(--color-text)] border-0 resize-none focus:outline-none text-sm leading-relaxed"
                  style={{ 
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - 30% */}
        <div className="bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col" style={{ width: '30%' }}>
          {/* Assistant Header */}
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-[var(--color-accent)]" />
              <span className="font-semibold text-[var(--color-text)]">AI Assistant</span>
            </div>
            <div className="px-3 py-1 bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-full text-xs font-medium">
              Voice Enabled
            </div>
          </div>

          {/* Command Input Section */}
          <div className="p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="font-semibold text-[var(--color-text)]">Voice Command or Text Input:</span>
            </div>
            
            <div className="relative mb-4">
              <textarea
                ref={editCommandRef}
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change... e.g., 'change header color to blue', 'add a contact form'"
                className={clsx(
                  'w-full h-24 p-4 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm resize-none focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all duration-200',
                  isVoiceActive && 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                )}
                disabled={isEditing}
                rows={3}
              />
              <div className="absolute bottom-3 right-3">
                <VoiceButton
                  onTranscript={handleVoiceCommand}
                  onInterimTranscript={handleInterimVoiceCommand}
                  size="md"
                  disabled={isEditing}
                />
              </div>
            </div>

            <button
              onClick={handleEdit}
              disabled={isEditing || !editCommand.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg)] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Apply Changes
                </>
              )}
            </button>
          </div>

          {/* Intelligent Response */}
          {intelligentResponse && (
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <ClientOnly>
                <IntelligentResponseComponent
                  response={intelligentResponse}
                  onSuggestionClick={handleIntelligentSuggestion}
                  onOptionClick={handleIntelligentOption}
                  onEditResponse={handleIntelligentEdit}
                />
              </ClientOnly>
            </div>
          )}

          {/* Quick Commands */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="font-semibold text-[var(--color-text)]">Quick Commands</span>
            </div>
            
            <div className="space-y-2">
              {[
                { icon: Palette, text: "Change header color to blue" },
                { icon: Type, text: "Make text bigger" },
                { icon: ImageIcon, text: "Add a contact form" },
                { icon: Settings, text: "Center the content" },
                { icon: Star, text: "Add animations" },
                { icon: Settings, text: "Make it responsive" }
              ].map((command, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickCommand(command.text)}
                  disabled={isEditing}
                  className="w-full p-3 bg-[var(--color-bg-alt)] hover:bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg text-left transition-all duration-200 disabled:opacity-50 hover:border-[var(--color-accent)]/50"
                >
                  <div className="flex items-start gap-3">
                    <command.icon className="w-4 h-4 text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text)] flex-1">{command.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Status Info */}
            <div className="mt-6 p-4 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-lg">
              <div className="text-xs text-[var(--color-text-secondary)] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
                  <span>Voice: Auto-stop after 4s silence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
                  <span>Keyboard: Enter to apply</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
                  <span>Real-time text insertion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 