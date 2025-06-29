import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEditorStore from '../store/editorStore';
import storageService from '../services/storageService';

/**
 * 🔗 STORAGE PERSISTENCE HOOK - Complete Integration
 * Replaces localStorage with MongoDB persistence and handles all exit warnings
 */
export const useStoragePersistence = (options = {}) => {
  const {
    enableAutoSave = true,
    autoSaveInterval = 30000, // 30 seconds
    enableExitWarning = true,
    enableBeforeUnload = true
  } = options;

  const router = useRouter();
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [exitWarningData, setExitWarningData] = useState(null);
  const pendingNavigation = useRef(null);
  const beforeUnloadHandler = useRef(null);
  
  // Store selectors
  const {
    sessionId,
    projectId,
    hasUnsavedChanges,
    isAuthenticated,
    currentUser,
    htmlContent,
    cssContent,
    jsContent,
    projectName,
    description,
    cursorPosition,
    scrollPosition,
    setAutoSaving,
    markAsSaved,
    setError,
    getCurrentState,
    getUnsavedChangesCount
  } = useEditorStore();

  // ========== AUTO-SAVE FUNCTIONALITY ==========

  const startAutoSave = useCallback(() => {
    if (!enableAutoSave || !isAuthenticated || !sessionId) return;

    console.log('🚀 Starting auto-save system...');
    
    const getStateForAutoSave = () => ({
      sessionId,
      htmlContent,
      cssContent,
      jsContent,
      hasUnsavedChanges,
      cursorPosition,
      scrollPosition
    });

    storageService.startAutoSave(getStateForAutoSave);
  }, [
    enableAutoSave, 
    isAuthenticated, 
    sessionId, 
    htmlContent, 
    cssContent, 
    jsContent, 
    hasUnsavedChanges,
    cursorPosition,
    scrollPosition
  ]);

  const stopAutoSave = useCallback(() => {
    console.log('🛑 Stopping auto-save system...');
    storageService.stopAutoSave();
  }, []);

  // ========== PROJECT MANAGEMENT ==========

  const saveProject = useCallback(async (projectData = {}) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to save your project');
    }

    try {
      setAutoSaving(true);
      
      const dataToSave = {
        sessionId,
        htmlContent,
        cssContent,
        jsContent,
        projectName: projectName || 'Untitled Project',
        description,
        metadata: {
          lastModified: new Date().toISOString(),
          wordCount: htmlContent.length + cssContent.length + jsContent.length,
          autoSave: false,
          ...projectData.metadata
        },
        ...projectData
      };

      // Validate data
      const validation = storageService.validateProjectData(dataToSave);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await storageService.saveProject(dataToSave);
      
      if (result.success) {
        markAsSaved(result.projectId, result.savedAt);
        console.log('✅ Project saved successfully:', result.projectId);
        return result;
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setAutoSaving(false);
    }
  }, [
    isAuthenticated,
    sessionId,
    htmlContent,
    cssContent,
    jsContent,
    projectName,
    description,
    setAutoSaving,
    markAsSaved,
    setError
  ]);

  const loadProject = useCallback(async ({ projectId: targetProjectId, sessionId: targetSessionId } = {}) => {
    try {
      const result = await storageService.loadProject({
        projectId: targetProjectId,
        sessionId: targetSessionId || sessionId
      });

      if (result.success) {
        useEditorStore.getState().loadProjectData(result.data);
        console.log('✅ Project loaded successfully');
        return result.data;
      }
    } catch (error) {
      console.error('❌ Load failed:', error);
      setError(error.message);
      throw error;
    }
  }, [sessionId, setError]);

  // ========== EXIT WARNING SYSTEM ==========

  const checkForUnsavedChanges = useCallback(async () => {
    if (!hasUnsavedChanges || !sessionId) {
      return { shouldWarn: false };
    }

    try {
      const result = await storageService.checkUnsavedChanges(
        sessionId, 
        htmlContent
      );
      
      return result;
    } catch (error) {
      console.warn('⚠️ Unable to check unsaved changes:', error);
      return {
        shouldWarn: hasUnsavedChanges,
        message: 'You have unsaved changes. Do you want to save before exiting?',
        unsavedChangesCount: getUnsavedChangesCount()
      };
    }
  }, [hasUnsavedChanges, sessionId, htmlContent, getUnsavedChangesCount]);

  const handleExitAttempt = useCallback(async (callback) => {
    if (!enableExitWarning) {
      callback?.();
      return;
    }

    const warningData = await checkForUnsavedChanges();
    
    if (warningData.shouldWarn) {
      setExitWarningData({
        ...warningData,
        onConfirm: callback
      });
      setShowExitWarning(true);
    } else {
      callback?.();
    }
  }, [enableExitWarning, checkForUnsavedChanges]);

  // ========== NAVIGATION INTERCEPTION ==========

  const interceptNavigation = useCallback((href) => {
    if (!hasUnsavedChanges || !enableExitWarning) {
      return true; // Allow navigation
    }

    pendingNavigation.current = href;
    handleExitAttempt(() => {
      if (pendingNavigation.current) {
        router.push(pendingNavigation.current);
        pendingNavigation.current = null;
      }
    });
    
    return false; // Block navigation
  }, [hasUnsavedChanges, enableExitWarning, handleExitAttempt, router]);

  // ========== BROWSER BEFOREUNLOAD ==========

  useEffect(() => {
    if (!enableBeforeUnload) return;

    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    beforeUnloadHandler.current = handleBeforeUnload;
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enableBeforeUnload]);

  // ========== AUTO-SAVE LIFECYCLE ==========

  useEffect(() => {
    if (enableAutoSave && isAuthenticated && sessionId && hasUnsavedChanges) {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => {
      stopAutoSave();
    };
  }, [
    enableAutoSave,
    isAuthenticated,
    sessionId,
    hasUnsavedChanges,
    startAutoSave,
    stopAutoSave
  ]);

  // ========== CLEANUP ON UNMOUNT ==========

  useEffect(() => {
    return () => {
      stopAutoSave();
      if (beforeUnloadHandler.current) {
        window.removeEventListener('beforeunload', beforeUnloadHandler.current);
      }
    };
  }, [stopAutoSave]);

  // ========== STATE RESTORATION ==========

  const restoreAutoSavedState = useCallback(async () => {
    if (!sessionId) return;

    try {
      const result = await storageService.restoreState(sessionId);
      
      if (result.success && result.data) {
        const shouldRestore = window.confirm(
          'Auto-saved state found. Do you want to restore your previous work?'
        );
        
        if (shouldRestore) {
          useEditorStore.getState().loadProjectData({
            html_content: result.data.html_content,
            css_content: result.data.css_content,
            js_content: result.data.js_content,
            last_modified: result.data.last_modified
          });
          
          // Restore cursor and scroll positions
          if (result.data.cursor_position) {
            useEditorStore.getState().setCursorPosition(result.data.cursor_position);
          }
          if (result.data.scroll_position) {
            useEditorStore.getState().setScrollPosition(result.data.scroll_position);
          }
          
          console.log('✅ Auto-saved state restored');
          return true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore auto-saved state:', error);
    }
    
    return false;
  }, [sessionId]);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    // Clear legacy localStorage on first load
    storageService.clearLegacyLocalStorage();
    
    // Attempt to restore auto-saved state
    if (sessionId) {
      restoreAutoSavedState();
    }
  }, [sessionId, restoreAutoSavedState]);

  // ========== MODAL HANDLERS ==========

  const handleExitWarningSave = useCallback(async (result) => {
    setShowExitWarning(false);
    
    if (exitWarningData?.onConfirm) {
      exitWarningData.onConfirm();
    }
    
    setExitWarningData(null);
  }, [exitWarningData]);

  const handleExitWarningDiscard = useCallback(() => {
    setShowExitWarning(false);
    
    // Clear unsaved changes
    useEditorStore.getState().setHasUnsavedChanges(false);
    
    if (exitWarningData?.onConfirm) {
      exitWarningData.onConfirm();
    }
    
    setExitWarningData(null);
  }, [exitWarningData]);

  const handleExitWarningCancel = useCallback(() => {
    setShowExitWarning(false);
    setExitWarningData(null);
    pendingNavigation.current = null;
  }, []);

  // ========== RETURN INTERFACE ==========

  return {
    // Core operations
    saveProject,
    loadProject,
    
    // Auto-save control
    startAutoSave,
    stopAutoSave,
    restoreAutoSavedState,
    
    // Exit warning system
    handleExitAttempt,
    interceptNavigation,
    checkForUnsavedChanges,
    
    // Modal state
    showExitWarning,
    exitWarningData,
    
    // Modal handlers
    handleExitWarningSave,
    handleExitWarningDiscard,
    handleExitWarningCancel,
    
    // State
    hasUnsavedChanges,
    isAuthenticated,
    sessionId,
    projectId,
    
    // Utils
    getUnsavedChangesCount: () => getUnsavedChangesCount()
  };
};

export default useStoragePersistence; 