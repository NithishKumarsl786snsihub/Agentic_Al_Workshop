'use client';

import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import clsx from 'clsx';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
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
      <div className={clsx(
        'rounded-full bg-gray-400 cursor-not-allowed flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        <MicOff className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={clsx(
          'btn-voice rounded-full flex items-center justify-center transition-all duration-300',
          {
            'recording voice-recording': isListening,
            'cursor-not-allowed opacity-50': disabled
          },
          sizeClasses[size],
          className
        )}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <Loader2 className={clsx(iconSizes[size], 'animate-spin')} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {/* Recording indicator */}
      {isListening && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded-md whitespace-nowrap">
          {error}
        </div>
      )}

      {/* Live transcript */}
      {transcript && isListening && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md max-w-xs">
          <div className="text-xs text-gray-400 mb-1">Listening...</div>
          <div className="font-medium">{transcript}</div>
        </div>
      )}
    </div>
  );
}; 