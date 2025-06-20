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
  CheckCircle
} from 'lucide-react';
import { VoiceButton } from '../../components/VoiceButton';
import { ClientOnly } from '../../components/ClientOnly';
import { apiService } from '../../services/api';
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
  };

  const handleEdit = async () => {
    if (!editCommand.trim() || !currentSession) {
      setMessage({ type: 'error', text: 'Please enter an edit command or use voice input' });
      return;
    }

    setIsEditing(true);
    setMessage(null);

    try {
      const response = await apiService.editWebsite({
        html_content: htmlContent,
        edit_command: editCommand.trim(),
        session_id: currentSession.sessionId
      });

      if (response.success) {
        setHtmlContent(response.html_content);
        updateCurrentHtml(response.html_content, 'edit', editCommand.trim());
        setEditCommand('');
        setMessage({ 
          type: 'success', 
          text: `Successfully applied: ${response.changes_made.join(', ')}` 
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to edit website' });
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

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">
        {isLoading ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 text-[#0e639c] animate-spin" />
            </div>
            <p className="text-[#cccccc] font-mono text-sm">Loading Editor...</p>
          </div>
        ) : (
          <div className="text-center p-8 bg-[#2d2d30] rounded border border-[#3e3e42]">
            <AlertCircle className="w-12 h-12 text-[#f48771] mx-auto mb-4" />
            <h2 className="text-lg font-mono text-[#cccccc] mb-2">No Session Found</h2>
            <p className="text-[#969696] font-mono text-sm mb-4">
              Please generate a website first
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white font-mono text-sm rounded transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(
      'min-h-screen bg-[var(--color-bg)] flex flex-col text-[var(--color-text)]',
      { 'fixed inset-0 z-50': isFullscreen }
    )}>
      {/* Developer-style Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 backdrop-filter backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <button
                onClick={() => router.push('/')}
                className="p-2.5 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-300 hover:scale-105"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--color-text)]" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
            </div>
            <div className="h-6 w-px bg-[var(--color-border)] mx-2"></div>
            <h1 className="font-mono text-sm text-[var(--color-text)] font-semibold">
              Website Editor - AI Assistant
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4 text-[var(--color-text)]" />
            </button>

            <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>

            {/* View Mode Toggle */}
            <div className="flex bg-[var(--color-bg-alt)] rounded-lg border border-[var(--color-border)] backdrop-filter backdrop-blur-lg">
              <button
                onClick={() => setViewMode('preview')}
                className={clsx(
                  'px-4 py-2 text-xs font-medium rounded-l-lg transition-all duration-300',
                  viewMode === 'preview' 
                    ? 'bg-[var(--color-accent)] text-[var(--color-text)] shadow-lg' 
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]'
                )}
              >
                <Eye className="w-3 h-3 inline mr-2" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={clsx(
                  'px-4 py-2 text-xs font-medium rounded-r-lg transition-all duration-300',
                  viewMode === 'code' 
                    ? 'bg-[var(--color-accent)] text-[var(--color-text)] shadow-lg' 
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass)]'
                )}
              >
                <Code className="w-3 h-3 inline mr-2" />
                Code
              </button>
            </div>

            <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>

            {/* Action Buttons */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-300 hover:scale-105"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 hover:bg-[var(--color-glass)] rounded-lg transition-all duration-300 hover:scale-105"
              title="Download HTML"
            >
              <Download className="w-4 h-4 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text)] text-xs font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {message && (
        <div className={clsx(
          'px-4 py-3 text-sm flex items-center gap-3 border-b border-[var(--color-border)] backdrop-filter backdrop-blur-lg',
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-500/10 to-green-600/5 text-green-400 border-green-500/20' 
            : 'bg-gradient-to-r from-red-500/10 to-red-600/5 text-red-400 border-red-500/20'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-mono font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Layout - Developer Tools Style */}
      <div className="flex-1 flex">
        {/* Preview Panel - 70% */}
        <div className="flex-1 flex flex-col" style={{ width: '70%' }}>
          {/* Preview Header */}
          <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between backdrop-filter backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-[var(--color-text)] font-semibold">Live Preview</span>
            </div>
            <div className="text-xs text-[var(--color-muted)] font-mono">
              {viewMode === 'preview' ? 'Rendered View' : 'Source Code'}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 bg-[var(--color-bg)] p-3">
            <div className="h-full bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-2xl">
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
                  className="w-full h-full p-6 bg-[var(--color-bg)] text-[var(--color-text)] border-0 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  style={{ 
                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - 30% */}
        <div className="bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col backdrop-filter backdrop-blur-lg" style={{ width: '30%' }}>
          {/* Assistant Header */}
          <div className="bg-[var(--color-bg-alt)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[var(--color-voice)] rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-[var(--color-text)] font-semibold">AI Assistant</span>
            </div>
            <div className="text-xs text-[var(--color-muted)] font-mono">Voice Enabled</div>
          </div>

          {/* Command Input Section */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <label className="block text-xs font-mono text-[var(--color-text)] mb-3 font-semibold">
              Voice Command or Text Input:
            </label>
            <div className="relative">
              <textarea
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change... e.g., 'change header color to blue', 'add a contact form'"
                className={`w-full h-24 p-4 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all duration-300 ${
                  isVoiceActive ? 'border-[var(--color-voice)] bg-gradient-to-br from-[var(--color-voice)]/5 to-transparent' : ''
                }`}
                disabled={isEditing}
                ref={editCommandRef}
              />
              
              {/* Voice Button */}
              <div className="absolute bottom-3 right-3">
                <VoiceButton
                  onTranscript={handleVoiceCommand}
                  onInterimTranscript={handleInterimVoiceCommand}
                  size="sm"
                  disabled={isEditing}
                />
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleEdit}
              disabled={isEditing || !editCommand.trim()}
              className="w-full mt-4 px-4 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text)] text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply Changes'
              )}
            </button>
          </div>

          {/* Quick Commands */}
          <div className="flex-1 p-4">
            <h4 className="text-xs font-mono text-[var(--color-text)] mb-4 flex items-center gap-3 font-semibold">
              Quick Commands
            </h4>
            <div className="space-y-2">
              {[
                "Change header color to blue",
                "Make text bigger", 
                "Add a contact form",
                "Center the content",
                "Add animations",
                "Make it responsive"
              ].map((command, index) => (
                <button
                  key={index}
                  onClick={() => setEditCommand(command)}
                  disabled={isEditing}
                  className="w-full text-left p-3 text-xs bg-[var(--color-bg-alt)] hover:bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:text-[var(--color-accent-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono hover:scale-[1.02] hover:shadow-lg"
                >
                  {command}
                </button>
              ))}
            </div>

            {/* Status Info */}
            <div className="mt-6 p-4 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-xl backdrop-filter backdrop-blur-lg">
              <div className="text-xs font-mono text-[var(--color-muted)] space-y-2 leading-relaxed">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[var(--color-voice)] rounded-full"></div>
                  Voice: Auto-stop after 4s silence
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full"></div>
                  Keyboard: Enter to apply
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[var(--color-accent-hover)] rounded-full"></div>
                  Real-time text insertion
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 