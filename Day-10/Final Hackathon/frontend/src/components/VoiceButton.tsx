'use client';

import React from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { ClientOnly } from './ClientOnly';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const VoiceButtonComponent: React.FC<VoiceButtonProps> = ({
  onTranscript,
  onInterimTranscript,
  className,
  size = 'md',
  disabled = false
}) => {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  // Pass transcript to parent when it changes
  React.useEffect(() => {
    if (transcript) {
      if (isListening && onInterimTranscript) {
        // Real-time interim results while listening
        onInterimTranscript(transcript);
      } else if (!isListening && transcript) {
        // Final result when stopped listening
        onTranscript(transcript);
        resetTranscript();
      }
    }
  }, [transcript, isListening, onTranscript, onInterimTranscript, resetTranscript]);

  const handleClick = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 p-2',
    md: 'w-12 h-12 p-3',
    lg: 'w-16 h-16 p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={`rounded-full bg-gray-300 cursor-not-allowed flex items-center justify-center border-2 border-gray-400 ${sizeClasses[size]} ${className || ''}`}>
          <MicOff className={`${iconSizes[size]} text-gray-600`} />
        </div>
        <span className="text-xs text-gray-500">Not supported</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg
            ${isListening 
              ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 shadow-red-500/25 animate-pulse' 
              : 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25'
            }
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:scale-110 active:scale-95 cursor-pointer'
            }
            ${className || ''}
          `}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? (
            <Volume2 className={`${iconSizes[size]} text-white animate-pulse`} />
          ) : (
            <Mic className={`${iconSizes[size]} text-white`} />
          )}
        </button>

        {/* Recording indicator */}
        {isListening && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-red-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10 border border-red-400">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45 border-l border-t border-red-400"></div>
            {error}
          </div>
        )}
      </div>

      {/* Procedure Indicator */}
      <div className="flex flex-col items-center gap-1">
        {isListening ? (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-red-600 font-medium">Listening...</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600 font-medium">
            {transcript ? 'Voice captured' : 'Tap to speak'}
          </span>
        )}
        
        {/* Voice procedure steps */}
        <div className="text-xs text-gray-500 text-center max-w-32">
          {isListening 
            ? "Speak clearly and tap again when done"
            : "Hold and speak your website description"
          }
        </div>
      </div>
    </div>
  );
};

export const VoiceButton: React.FC<VoiceButtonProps> = (props) => {
  return (
    <ClientOnly fallback={
      <div className="flex flex-col items-center gap-2">
        <div className={`rounded-full bg-gray-300 cursor-not-allowed flex items-center justify-center border-2 border-gray-400 ${
          props.size === 'sm' ? 'w-8 h-8 p-2' : props.size === 'lg' ? 'w-16 h-16 p-4' : 'w-12 h-12 p-3'
        } ${props.className || ''}`}>
          <MicOff className={`${props.size === 'sm' ? 'w-4 h-4' : props.size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'} text-gray-600`} />
        </div>
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    }>
      <VoiceButtonComponent {...props} />
    </ClientOnly>
  );
}; 