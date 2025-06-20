'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  HelpCircle, 
  Lightbulb, 
  MessageSquare, 
  Edit3, 
  Volume2,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { IntelligentResponse } from '../services/api';
import clsx from 'clsx';

interface IntelligentResponseComponentProps {
  response: IntelligentResponse;
  onSuggestionClick?: (suggestion: string) => void;
  onOptionClick?: (option: string) => void;
  onEditResponse?: (newCommand: string) => void;
  className?: string;
}

export const IntelligentResponseComponent: React.FC<IntelligentResponseComponentProps> = ({
  response,
  onSuggestionClick,
  onOptionClick,
  onEditResponse,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(response.original_command || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response.message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(response.message);
  };

  const handleEditSubmit = () => {
    if (onEditResponse && editText.trim()) {
      onEditResponse(editText.trim());
      setIsEditing(false);
    }
  };

  const getResponseIcon = () => {
    switch (response.type) {
      case 'confirmation':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'clarification':
        return <HelpCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  const getResponseColor = () => {
    switch (response.type) {
      case 'confirmation':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'clarification':
        return 'border-amber-500/30 bg-amber-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className={clsx(
      'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden',
      getResponseColor(),
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getResponseIcon()}
          <div>
            <h4 className="font-semibold text-[var(--color-text)] text-sm">
              {response.type === 'confirmation' ? 'AI Confirmation' : 'Clarification Needed'}
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {response.summary}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {response.voice_friendly && (
            <button
              onClick={handlePlayVoice}
              className="p-2 hover:bg-[var(--color-bg-alt)] rounded-lg transition-colors"
              title="Play voice response"
            >
              <Volume2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          )}
          
          <button
            onClick={handleCopyText}
            className="p-2 hover:bg-[var(--color-bg-alt)] rounded-lg transition-colors"
            title="Copy response"
          >
            <Copy className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-[var(--color-bg-alt)] rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Main Message */}
          <div className="bg-[var(--color-bg-alt)]/50 rounded-lg p-3">
            <p className="text-[var(--color-text)] leading-relaxed">
              {response.message}
            </p>
          </div>

          {/* Clarification Options */}
          {response.type === 'clarification' && response.options && response.options.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Please choose an option:
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {response.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => onOptionClick?.(option)}
                    className="text-left p-3 bg-[var(--color-bg-alt)] hover:bg-[var(--color-accent)]/20 border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 rounded-lg transition-all duration-200"
                  >
                    <span className="text-[var(--color-text)] text-sm">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Question */}
          {response.follow_up_question && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm font-medium mb-1">Follow-up suggestion:</p>
              <p className="text-[var(--color-text)] text-sm">{response.follow_up_question}</p>
            </div>
          )}

          {/* Smart Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] mb-2 hover:text-[var(--color-accent)] transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                Smart Suggestions ({response.suggestions.length})
                {showSuggestions ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {showSuggestions && (
                <div className="space-y-2">
                  {response.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSuggestionClick?.(suggestion)}
                      className="flex items-center gap-3 w-full text-left p-3 bg-[var(--color-bg-alt)] hover:bg-[var(--color-accent)]/10 border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 rounded-lg transition-all duration-200 group"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--color-accent)] group-hover:scale-110 transition-transform" />
                      <span className="text-[var(--color-text)] text-sm group-hover:text-[var(--color-accent)] transition-colors">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Editable Response */}
          {response.editable && response.original_command && (
            <div>
              <h5 className="text-sm font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Refine your command:
              </h5>
              
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm resize-none focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    rows={3}
                    placeholder="Enter your refined command..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSubmit}
                      className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg)] font-medium rounded-lg text-sm transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditText(response.original_command || '');
                      }}
                      className="px-4 py-2 bg-[var(--color-bg-alt)] hover:bg-[var(--color-border)] text-[var(--color-text)] font-medium rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-lg">
                    <span className="text-[var(--color-text)] text-sm">"{response.original_command}"</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 text-[var(--color-accent)] rounded-lg transition-colors"
                    title="Edit command"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Metadata (Debug Info) */}
          {response.metadata && Object.keys(response.metadata).length > 0 && (
            <details className="text-xs text-[var(--color-text-muted)]">
              <summary className="cursor-pointer hover:text-[var(--color-text-secondary)]">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-[var(--color-bg-alt)] rounded border">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(response.metadata, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}; 