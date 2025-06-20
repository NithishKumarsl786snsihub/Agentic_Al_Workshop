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
  Sparkles,
  Bot,
  User
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

  return (
    <div className={clsx('chatbot-conversation', className)}>
      <style jsx>{`
        .chatbot-conversation {
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .ai-message-bubble {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 100%;
        }
        
        .ai-avatar {
          width: 32px;
          height: 32px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
        }
        
        .message-content {
          flex: 1;
          background: #2d2d2d;
          border-radius: 16px 16px 16px 4px;
          padding: 16px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .ai-label {
          font-weight: 600;
          color: #10b981;
          font-size: 12px;
        }
        
        .message-type-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .confirmation-badge {
          background: #10b981;
          color: white;
        }
        
        .clarification-badge {
          background: #f59e0b;
          color: white;
        }
        
        .message-text {
          color: #e5e5e5;
          margin-bottom: 12px;
        }
        
        .message-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .action-button {
          background: transparent;
          border: 1px solid #404040;
          color: #cccccc;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-button:hover {
          background: #404040;
          border-color: #10b981;
          color: #10b981;
        }
        
        .follow-up-section {
          margin-top: 16px;
          padding: 12px;
          background: #1a1a1a;
          border-radius: 8px;
          border-left: 3px solid #10b981;
        }
        
        .follow-up-label {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          margin-bottom: 6px;
        }
        
        .follow-up-text {
          color: #e5e5e5;
          font-size: 13px;
        }
        
        .options-section {
          margin-top: 16px;
        }
        
        .options-label {
          font-size: 13px;
          font-weight: 600;
          color: #cccccc;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .option-button {
          display: block;
          width: 100%;
          text-align: left;
          background: #1a1a1a;
          border: 1px solid #404040;
          color: #e5e5e5;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          font-size: 13px;
        }
        
        .option-button:hover {
          background: #10b981;
          border-color: #10b981;
          color: white;
          transform: translateY(-1px);
        }
        
        .suggestions-section {
          margin-top: 16px;
        }
        
        .suggestions-toggle {
          background: transparent;
          border: none;
          color: #cccccc;
          padding: 8px 0;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .suggestions-toggle:hover {
          color: #10b981;
        }
        
        .suggestion-button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          background: #1a1a1a;
          border: 1px solid #404040;
          color: #e5e5e5;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          font-size: 13px;
        }
        
        .suggestion-button:hover {
          background: #10b981;
          border-color: #10b981;
          color: white;
          transform: translateY(-1px);
        }
        
        .suggestion-button:hover .suggestion-icon {
          transform: scale(1.1);
          color: white;
        }
        
        .suggestion-icon {
          color: #10b981;
          transition: all 0.2s ease;
        }
        
        .details-section {
          margin-top: 16px;
          padding: 12px;
          background: #1a1a1a;
          border-radius: 8px;
        }
        
        .details-summary {
          cursor: pointer;
          color: #888888;
          font-size: 12px;
          transition: color 0.2s ease;
        }
        
        .details-summary:hover {
          color: #cccccc;
        }
        
        .details-content {
          margin-top: 8px;
          padding: 8px;
          background: #0f0f0f;
          border-radius: 4px;
          border: 1px solid #333333;
        }
        
        .details-pre {
          font-size: 11px;
          color: #888888;
          overflow-x: auto;
          white-space: pre-wrap;
        }
      `}</style>

      {/* AI Message Bubble */}
      <div className="ai-message-bubble">
        <div className="ai-avatar">
          <Bot className="w-4 h-4 text-white" />
        </div>
        
        <div className="message-content">
          {/* Message Header */}
          <div className="message-header">
            <span className="ai-label">AI Assistant</span>
            <span className={clsx(
              'message-type-badge',
              response.type === 'confirmation' ? 'confirmation-badge' : 'clarification-badge'
            )}>
              {response.type === 'confirmation' ? 'Confirmation' : 'Clarification'}
            </span>
          </div>

          {/* Main Message */}
          <div className="message-text">
            {response.message}
          </div>

          {/* Message Actions */}
          <div className="message-actions">
            {response.voice_friendly && (
              <button
                onClick={handlePlayVoice}
                className="action-button"
                title="Play voice response"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleCopyText}
              className="action-button"
              title="Copy response"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Follow-up Question */}
          {response.follow_up_question && (
            <div className="follow-up-section">
              <div className="follow-up-label">Follow-up suggestion:</div>
              <div className="follow-up-text">{response.follow_up_question}</div>
            </div>
          )}

          {/* Clarification Options */}
          {response.type === 'clarification' && response.options && response.options.length > 0 && (
            <div className="options-section">
              <div className="options-label">
                <HelpCircle className="w-4 h-4" />
                Please choose an option:
              </div>
              {response.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onOptionClick?.(option)}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Smart Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div className="suggestions-section">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="suggestions-toggle"
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
                <div>
                  {response.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSuggestionClick?.(suggestion)}
                      className="suggestion-button"
                    >
                      <Sparkles className="w-4 h-4 suggestion-icon" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technical Details */}
          {response.metadata && Object.keys(response.metadata).length > 0 && (
            <div className="details-section">
              <details>
                <summary className="details-summary">
                  Technical Details
                </summary>
                <div className="details-content">
                  <pre className="details-pre">
                    {JSON.stringify(response.metadata, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};