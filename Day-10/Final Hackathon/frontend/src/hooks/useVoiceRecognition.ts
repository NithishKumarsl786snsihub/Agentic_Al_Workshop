'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        
        // Configure recognition settings
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
        
        // Event handlers
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalText = '';
          let interimText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript;
              setConfidence(result[0].confidence);
            } else {
              interimText += result[0].transcript;
            }
          }
          
          if (finalText) {
            const trimmedFinal = finalText.trim();
            setFinalTranscript(trimmedFinal);
            setTranscript(trimmedFinal);
            setInterimTranscript('');
          } else if (interimText) {
            const trimmedInterim = interimText.trim();
            setInterimTranscript(trimmedInterim);
            setTranscript(trimmedInterim);
          }
        };
        
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    try {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds of silence
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      }, 10000);
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
} 