'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  appendToTranscript: (text: string) => void;
  syncTranscript: (text: string) => void;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const baseTranscriptRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Debounced state update to prevent glitching
  const debouncedUpdateTranscript = useCallback((newTranscript: string, interim: string = '') => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        setTranscript(newTranscript);
        setInterimTranscript(interim);
        isProcessingRef.current = false;
      }
    }, 50); // 50ms debounce to prevent rapid updates
  }, []);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
          // Clear any existing pause timeout
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
          }
        };
        
        recognitionRef.current.onresult = (event: any) => {
          if (isProcessingRef.current) return; // Prevent overlapping processing
          
          let finalText = '';
          let interimText = '';
          
          // Process only the latest results to avoid glitching
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript;
              setConfidence(result[0].confidence);
            } else {
              interimText += result[0].transcript;
            }
          }
          
          const baseText = baseTranscriptRef.current;
          
          if (finalText) {
            // Handle final text - update immediately without debounce
            const newBaseText = baseText + (baseText ? ' ' : '') + finalText.trim();
            baseTranscriptRef.current = newBaseText;
            setFinalTranscript(newBaseText);
            setTranscript(newBaseText);
            setInterimTranscript('');
            
            // Reset pause timeout since we got final text
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
            }
            
            // Set new pause timeout for 10 seconds
            pauseTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (e) {
                  // Ignore errors during stop
                }
              }
            }, 10000);
          } else if (interimText) {
            // Handle interim text with debouncing to prevent glitching
            const combinedText = baseText + (baseText ? ' ' : '') + interimText.trim();
            debouncedUpdateTranscript(combinedText, interimText.trim());
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          
          // Only show user-friendly errors
          if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
          } else if (event.error === 'network') {
            setError('Network error. Please check your connection.');
          } else if (event.error !== 'aborted') {
            setError('Speech recognition error. Please try again.');
          }
          
          setIsListening(false);
          isProcessingRef.current = false;
          
          // Clear timeouts on error
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          isProcessingRef.current = false;
          
          // Clear timeouts when ending
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
          }
        };
      }
    }
  }, []); // Remove isListening dependency to prevent re-renders

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (isListening) {
      // If already listening, don't start again
      return;
    }
    
    try {
      setError(null);
      setInterimTranscript('');
      isProcessingRef.current = false;
      
      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      recognitionRef.current.start();
      
      // Set initial pause timeout for 10 seconds
      pauseTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore errors during stop
          }
        }
      }, 10000);
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        setError('Failed to start speech recognition');
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors during stop
      }
    }
    
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    isProcessingRef.current = false;
  }, []);

  const resetTranscript = useCallback(() => {
    // Clear all timeouts first
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    isProcessingRef.current = false;
    baseTranscriptRef.current = '';
    
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  const appendToTranscript = useCallback((text: string) => {
    const currentBase = baseTranscriptRef.current;
    const newText = currentBase + (currentBase ? ' ' : '') + text.trim();
    baseTranscriptRef.current = newText;
    setTranscript(newText);
    setFinalTranscript(newText);
  }, []);

  const syncTranscript = useCallback((text: string) => {
    // Prevent sync during active voice processing
    if (isProcessingRef.current) return;
    
    // Clear any pending debounced updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Sync manually edited text with the voice recognition system
    baseTranscriptRef.current = text;
    setTranscript(text);
    setFinalTranscript(text);
    setInterimTranscript('');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      // Clear all timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
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
    appendToTranscript,
    syncTranscript,
  };
};

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
} 