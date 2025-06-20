'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessionData {
  sessionId: string;
  prompt: string;
  htmlContent: string;
  timestamp: number;
  history: Array<{
    action: string;
    timestamp: number;
    htmlContent: string;
    prompt?: string;
  }>;
}

interface UseSessionStorageReturn {
  currentSession: SessionData | null;
  sessions: SessionData[];
  saveSession: (sessionData: SessionData) => void;
  loadSession: (sessionId: string) => SessionData | null;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  updateCurrentHtml: (htmlContent: string, action: string, prompt?: string) => void;
}

export const useSessionStorage = (): UseSessionStorageReturn => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        const storedSessions = localStorage.getItem('voice-website-sessions');
        const currentSessionId = localStorage.getItem('current-session-id');
        
        if (storedSessions) {
          const parsedSessions: SessionData[] = JSON.parse(storedSessions);
          setSessions(parsedSessions);
          
          if (currentSessionId) {
            const current = parsedSessions.find(s => s.sessionId === currentSessionId);
            if (current) {
              setCurrentSession(current);
            }
          }
        }
      } catch (error) {
        console.error('Error loading sessions from localStorage:', error);
      }
    }
  }, [isClient]);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && sessions.length > 0) {
      try {
        localStorage.setItem('voice-website-sessions', JSON.stringify(sessions));
      } catch (error) {
        console.error('Error saving sessions to localStorage:', error);
      }
    }
  }, [sessions, isClient]);

  // Save current session ID to localStorage
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && currentSession) {
      try {
        localStorage.setItem('current-session-id', currentSession.sessionId);
      } catch (error) {
        console.error('Error saving current session ID:', error);
      }
    }
  }, [currentSession, isClient]);

  const saveSession = useCallback((sessionData: SessionData) => {
    setSessions(prevSessions => {
      const existingIndex = prevSessions.findIndex(s => s.sessionId === sessionData.sessionId);
      
      if (existingIndex >= 0) {
        // Update existing session
        const updatedSessions = [...prevSessions];
        updatedSessions[existingIndex] = sessionData;
        return updatedSessions;
      } else {
        // Add new session
        return [...prevSessions, sessionData];
      }
    });
    
    setCurrentSession(sessionData);
  }, []);

  const loadSession = useCallback((sessionId: string): SessionData | null => {
    const session = sessions.find(s => s.sessionId === sessionId);
    if (session) {
      setCurrentSession(session);
      return session;
    }
    return null;
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prevSessions => prevSessions.filter(s => s.sessionId !== sessionId));
    
    if (currentSession?.sessionId === sessionId) {
      setCurrentSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current-session-id');
      }
    }
  }, [currentSession]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voice-website-sessions');
      localStorage.removeItem('current-session-id');
    }
  }, []);

  const updateCurrentHtml = useCallback((htmlContent: string, action: string, prompt?: string) => {
    if (!currentSession) return;

    const updatedSession: SessionData = {
      ...currentSession,
      htmlContent,
      history: [
        ...currentSession.history,
        {
          action,
          timestamp: Date.now(),
          htmlContent,
          prompt
        }
      ]
    };

    saveSession(updatedSession);
  }, [currentSession, saveSession]);

  return {
    currentSession,
    sessions,
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    updateCurrentHtml,
  };
}; 