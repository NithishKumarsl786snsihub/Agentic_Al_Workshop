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
  className?: string;
}

export const IntelligentResponseComponent: React.FC<IntelligentResponseComponentProps> = ({
  response,
  onSuggestionClick,
  onOptionClick,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showOptions, setShowOptions] = useState(true);

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window) {
      const textToSpeak = response.follow_up_question || response.message;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopyText = () => {
    const textToCopy = `${response.message}${response.follow_up_question ? `\n\nFollow-up: ${response.follow_up_question}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  // Determine the response type and styling
  const getResponseTypeInfo = () => {
    if (response.type === 'error_assistance') {
      return {  
        badge: 'Troubleshooting',
        badgeClass: 'error-badge',
        icon: <HelpCircle className="w-3 h-3" />
      };
    } else if (response.follow_up_question || response.suggestions?.length) {
      return {
        badge: 'Smart Assistant',
        badgeClass: 'smart-badge',
        icon: <Sparkles className="w-3 h-3" />
      };
    } else {
      return {
        badge: 'Confirmed',
        badgeClass: 'confirmation-badge',
        icon: <CheckCircle className="w-3 h-3" />
      };
    }
  };

  const typeInfo = getResponseTypeInfo();

  return (
    <div className={clsx('chatbot-conversation', className)}>
      <style jsx>{`
        .chatbot-conversation {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .ai-message-bubble {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 100%;
        }
        
        .ai-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
        }
        
        .message-content {
          flex: 1;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 12px 12px 12px 4px;
          padding: 14px;
          color: #ffffff;
          font-size: 13px;
          line-height: 1.5;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .message-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        
        .ai-label {
          font-weight: 600;
          color: #a855f7;
          font-size: 11px;
        }
        
        .message-type-badge {
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .confirmation-badge {
          background: #059669;
          color: white;
        }
        
        .smart-badge {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
        }
        
        .error-badge {
          background: #dc2626;
          color: white;
        }
        
        .message-text {
          color: #e5e7eb;
          margin-bottom: 10px;
          font-weight: 400;
        }
        
        .message-actions {
          display: flex;
          gap: 6px;
          margin-top: 10px;
        }
        
        .action-button {
          background: transparent;
          border: 1px solid #374151;
          color: #9ca3af;
          padding: 4px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }
        
        .action-button:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
          color: #a855f7;
        }
        
        .follow-up-section {
          margin-top: 12px;
          padding: 10px;
          background: rgba(139, 92, 246, 0.05);
          border-radius: 8px;
          border-left: 3px solid #8b5cf6;
        }
        
        .follow-up-label {
          font-size: 11px;
          font-weight: 600;
          color: #a855f7;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .follow-up-text {
          color: #d1d5db;
          font-size: 12px;
          font-style: italic;
        }
        
        .suggestions-section {
          margin-top: 12px;
        }
        
        .suggestions-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          padding: 4px 0;
        }
        
        .suggestions-label {
          font-size: 11px;
          font-weight: 600;
          color: #a855f7;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .suggestions-toggle {
          color: #6b7280;
          transition: transform 0.2s ease;
        }
        
        .suggestions-toggle.expanded {
          transform: rotate(90deg);
        }
        
        .suggestion-button {
          display: block;
          width: 100%;
          text-align: left;
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #d1d5db;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 6px;
          font-size: 12px;
          position: relative;
        }
        
        .suggestion-button:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
        }
        
        .suggestion-button:last-child {
          margin-bottom: 0;
        }
        
        .metadata-info {
          margin-top: 10px;
          padding: 6px 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          font-size: 10px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .confidence-bar {
          width: 30px;
          height: 3px;
          background: #374151;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
          transition: width 0.5s ease;
        }
      `}</style>

      <div className="ai-message-bubble">
        <div className="ai-avatar">
          <Bot className="w-4 h-4 text-white" />
        </div>
        
        <div className="message-content">
          <div className="message-header">
            <span className="ai-label">AI Assistant</span>
            <div className={`message-type-badge ${typeInfo.badgeClass}`}>
              {typeInfo.icon}
              {typeInfo.badge}
            </div>
          </div>
          
          <div className="message-text">
            {response.message}
          </div>

          {/* Follow-up Question */}
          {response.follow_up_question && (
            <div className="follow-up-section">
              <div className="follow-up-label">
                <HelpCircle className="w-3 h-3" />
                Quick Question
              </div>
              <div className="follow-up-text">
                {response.follow_up_question}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div className="suggestions-section">
              <div 
                className="suggestions-header"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <div className="suggestions-label">
                  <Lightbulb className="w-3 h-3" />
                  Smart Suggestions ({response.suggestions.length})
                </div>
                <ChevronRight className={`w-3 h-3 suggestions-toggle ${showSuggestions ? 'expanded' : ''}`} />
              </div>
              
              {showSuggestions && (
                <div>
                  {response.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      title="Click to apply this suggestion"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="message-actions">
            {response.voice_friendly && (
              <button
                className="action-button"
                onClick={handlePlayVoice}
                title="Listen to response"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
            <button
              className="action-button"
              onClick={handleCopyText}
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          {/* Metadata and Confidence */}
          {response.metadata && (
            <div className="metadata-info">
              <span>{response.metadata.website_type} • {response.metadata.intent}</span>
              {response.metadata.confidence && (
                <div className="confidence-indicator">
                  <span>Confidence</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${response.metadata.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};