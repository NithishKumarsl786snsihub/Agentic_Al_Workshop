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
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-muted)] mb-4">No session found</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'min-h-screen bg-[var(--color-bg)] flex flex-col',
      { 'fixed inset-0 z-50': isFullscreen }
    )}>
      {/* Header */}
      <header className="bg-[var(--color-bg-alt)] border-b border-[var(--color-forest)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[var(--color-pine)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
              </button>
            )}
            <h1 className="font-axiforma-semibold text-xl text-[var(--color-text)]">
              Website Editor
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-[var(--color-pine)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-[var(--color-pine)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-[var(--color-bg)] rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'preview' 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'code' 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-[var(--color-pine)] rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 hover:bg-[var(--color-pine)] rounded-lg transition-colors"
              title="Download HTML"
            >
              <Download className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-4 py-2 flex items-center gap-2"
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

      {/* Message */}
      {message && (
        <div className={clsx(
          'p-4 flex items-center gap-3 border-b',
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-axiforma-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Preview Panel */}
        <div className="flex-1 p-4">
          <div className="h-full bg-white rounded-lg border border-[var(--color-forest)] overflow-hidden">
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
                className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-0 resize-none focus:outline-none"
                style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
              />
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="w-80 bg-[var(--color-bg-alt)] border-l border-[var(--color-forest)] p-4 flex flex-col">
          <h3 className="font-axiforma-semibold text-lg text-[var(--color-text)] mb-4">
            🎤 Voice Editor
          </h3>

          {/* Edit Command Input */}
          <div className="space-y-4 flex-1">
            <div className="relative">
              <textarea
                value={editCommand}
                onChange={handleEditCommandChange}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what to change... (e.g., 'change header color to blue', 'add a contact form')"
                className={`input-field w-full h-24 resize-none font-axiforma-medium text-sm ${
                  isVoiceActive ? 'ring-2 ring-[var(--color-voice)]/50 bg-[var(--color-voice)]/5' : ''
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

            {/* Edit Button */}
            <button
              onClick={handleEdit}
              disabled={isEditing || !editCommand.trim()}
              className="btn-primary w-full py-3 font-axiforma-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                'Apply Changes'
              )}
            </button>

            {/* Quick Commands */}
            <div className="pt-4 border-t border-[var(--color-forest)]">
              <h4 className="font-axiforma-medium text-sm text-[var(--color-text)] mb-3">
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
                    className="w-full text-left p-2 text-xs bg-[var(--color-bg)] hover:bg-[var(--color-pine)] border border-[var(--color-forest)] rounded text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {command}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 