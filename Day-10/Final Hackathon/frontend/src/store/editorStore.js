import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * 💾 EDITOR STATE STORE - Professional State Management
 * Replaces localStorage with robust state management system
 */
const useEditorStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // ========== CORE STATE ==========
        sessionId: null,
        projectId: null,
        isAuthenticated: false,
        currentUser: null,
        
        // ========== EDITOR CONTENT ==========
        htmlContent: '',
        cssContent: '',
        jsContent: '',
        projectName: '',
        description: '',
        metadata: {},
        
        // ========== STATE TRACKING ==========
        lastSaved: null,
        hasUnsavedChanges: false,
        isAutoSaving: false,
        isSaving: false,
        isLoading: false,
        
        // ========== CURSOR & SCROLL ==========
        cursorPosition: { line: 1, column: 1 },
        scrollPosition: { top: 0, left: 0 },
        
        // ========== PROJECT MANAGEMENT ==========
        projects: [],
        currentProject: null,
        
        // ========== ERROR HANDLING ==========
        error: null,
        saveError: null,
        
        // ========== ACTIONS ==========
        
        // Auth Actions
        setAuth: (user, token) => set({
          isAuthenticated: !!user,
          currentUser: user,
          error: null
        }),
        
        clearAuth: () => set({
          isAuthenticated: false,
          currentUser: null,
          sessionId: null,
          projectId: null
        }),
        
        // Session Management
        setSessionId: (sessionId) => set({ sessionId }),
        
        setProjectId: (projectId) => set({ projectId }),
        
        // Content Management
        setHtmlContent: (content) => {
          const currentContent = get().htmlContent;
          if (currentContent !== content) {
            set({
              htmlContent: content,
              hasUnsavedChanges: true,
              error: null
            });
          }
        },
        
        setCssContent: (content) => {
          const currentContent = get().cssContent;
          if (currentContent !== content) {
            set({
              cssContent: content,
              hasUnsavedChanges: true
            });
          }
        },
        
        setJsContent: (content) => {
          const currentContent = get().jsContent;
          if (currentContent !== content) {
            set({
              jsContent: content,
              hasUnsavedChanges: true
            });
          }
        },
        
        setProjectMetadata: (name, description, metadata = {}) => set({
          projectName: name,
          description,
          metadata,
          hasUnsavedChanges: true
        }),
        
        // State Tracking
        setCursorPosition: (position) => set({ cursorPosition: position }),
        
        setScrollPosition: (position) => set({ scrollPosition: position }),
        
        setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
        
        // Loading States
        setLoading: (isLoading) => set({ isLoading }),
        
        setSaving: (isSaving) => set({ isSaving }),
        
        setAutoSaving: (isAutoSaving) => set({ isAutoSaving }),
        
        // Project Management
        setProjects: (projects) => set({ projects }),
        
        addProject: (project) => set(state => ({
          projects: [project, ...state.projects]
        })),
        
        updateProject: (projectId, updates) => set(state => ({
          projects: state.projects.map(p => 
            p.project_id === projectId ? { ...p, ...updates } : p
          )
        })),
        
        removeProject: (projectId) => set(state => ({
          projects: state.projects.filter(p => p.project_id !== projectId)
        })),
        
        setCurrentProject: (project) => set({ 
          currentProject: project,
          projectId: project?.project_id || null
        }),
        
        // Error Handling
        setError: (error) => set({ error }),
        
        setSaveError: (error) => set({ saveError }),
        
        clearError: () => set({ error: null, saveError: null }),
        
        // ========== COMPLEX ACTIONS ==========
        
        // Load Project Data
        loadProjectData: (projectData) => set({
          htmlContent: projectData.html_content || '',
          cssContent: projectData.css_content || '',
          jsContent: projectData.js_content || '',
          projectName: projectData.project_name || '',
          description: projectData.description || '',
          metadata: projectData.metadata || {},
          projectId: projectData.project_id,
          lastSaved: projectData.last_modified ? new Date(projectData.last_modified) : null,
          hasUnsavedChanges: false,
          error: null
        }),
        
        // Mark as Saved
        markAsSaved: (projectId, savedAt = new Date()) => set({
          projectId,
          lastSaved: savedAt,
          hasUnsavedChanges: false,
          isSaving: false,
          isAutoSaving: false,
          saveError: null
        }),
        
        // Reset State
        resetEditor: () => set({
          htmlContent: '',
          cssContent: '',
          jsContent: '',
          projectName: '',
          description: '',
          metadata: {},
          projectId: null,
          hasUnsavedChanges: false,
          lastSaved: null,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          error: null,
          saveError: null
        }),
        
        // Get Current State for API
        getCurrentState: () => {
          const state = get();
          return {
            sessionId: state.sessionId,
            htmlContent: state.htmlContent,
            cssContent: state.cssContent,
            jsContent: state.jsContent,
            projectName: state.projectName,
            description: state.description,
            metadata: state.metadata,
            cursorPosition: state.cursorPosition,
            scrollPosition: state.scrollPosition
          };
        },
        
        // Check if content has changed
        hasContentChanged: (originalContent) => {
          const current = get();
          return (
            current.htmlContent !== (originalContent.html_content || '') ||
            current.cssContent !== (originalContent.css_content || '') ||
            current.jsContent !== (originalContent.js_content || '')
          );
        },
        
        // Get unsaved changes count
        getUnsavedChangesCount: () => {
          const state = get();
          let changes = 0;
          
          if (state.htmlContent.length > 0) changes += state.htmlContent.length;
          if (state.cssContent.length > 0) changes += state.cssContent.length;
          if (state.jsContent.length > 0) changes += state.jsContent.length;
          
          return changes;
        }
      }),
      {
        name: 'voice-website-editor', // localStorage key
        partialize: (state) => ({
          // Only persist essential data, not UI state
          sessionId: state.sessionId,
          projectId: state.projectId,
          isAuthenticated: state.isAuthenticated,
          currentUser: state.currentUser,
          projects: state.projects,
          currentProject: state.currentProject
        })
      }
    ),
    {
      name: 'voice-website-editor-store' // DevTools name
    }
  )
);

// ========== SELECTORS ==========
export const useEditorContent = () => useEditorStore(state => ({
  htmlContent: state.htmlContent,
  cssContent: state.cssContent,
  jsContent: state.jsContent,
  setHtmlContent: state.setHtmlContent,
  setCssContent: state.setCssContent,
  setJsContent: state.setJsContent
}));

export const useProjectInfo = () => useEditorStore(state => ({
  projectId: state.projectId,
  projectName: state.projectName,
  description: state.description,
  metadata: state.metadata,
  currentProject: state.currentProject,
  setProjectMetadata: state.setProjectMetadata,
  setCurrentProject: state.setCurrentProject
}));

export const useSaveState = () => useEditorStore(state => ({
  hasUnsavedChanges: state.hasUnsavedChanges,
  isSaving: state.isSaving,
  isAutoSaving: state.isAutoSaving,
  lastSaved: state.lastSaved,
  saveError: state.saveError,
  setSaving: state.setSaving,
  setAutoSaving: state.setAutoSaving,
  markAsSaved: state.markAsSaved,
  setSaveError: state.setSaveError
}));

export const useAuth = () => useEditorStore(state => ({
  isAuthenticated: state.isAuthenticated,
  currentUser: state.currentUser,
  setAuth: state.setAuth,
  clearAuth: state.clearAuth
}));

export const useProjects = () => useEditorStore(state => ({
  projects: state.projects,
  setProjects: state.setProjects,
  addProject: state.addProject,
  updateProject: state.updateProject,
  removeProject: state.removeProject
}));

export default useEditorStore; 