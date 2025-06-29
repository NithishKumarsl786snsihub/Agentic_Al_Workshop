import api from './api';

/**
 * 💾 STORAGE SERVICE - Professional MongoDB Integration
 * Handles all storage operations, replacing localStorage completely
 */
class StorageService {
  constructor() {
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
    this.isAutoSaving = false;
  }

  // ========== PROJECT MANAGEMENT ==========
  
  /**
   * Save project to MongoDB
   */
  async saveProject({
    sessionId,
    htmlContent,
    cssContent = '',
    jsContent = '',
    projectName = '',
    description = '',
    metadata = {},
    autoSave = false
  }) {
    try {
      console.log('💾 Saving project to MongoDB...', { projectName, autoSave });
      
      const response = await api.post('/projects/save', {
        session_id: sessionId,
        html_content: htmlContent,
        css_content: cssContent,
        js_content: jsContent,
        project_name: projectName || `Project_${sessionId?.slice(0, 8)}`,
        description,
        metadata,
        auto_save: autoSave
      });

      if (response.data.success) {
        console.log('✅ Project saved successfully:', response.data.project_id);
        return {
          success: true,
          projectId: response.data.project_id,
          savedAt: new Date(response.data.saved_at),
          message: response.data.message,
          filePath: response.data.file_path
        };
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error) {
      console.error('❌ Project save error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to save project'
      );
    }
  }

  /**
   * Load project from MongoDB
   */
  async loadProject({ projectId, sessionId }) {
    try {
      console.log('📂 Loading project from MongoDB...', { projectId, sessionId });
      
      const response = await api.post('/projects/load', {
        project_id: projectId,
        session_id: sessionId
      });

      if (response.data.success) {
        console.log('✅ Project loaded successfully');
        return {
          success: true,
          data: {
            html_content: response.data.html_content,
            css_content: response.data.css_content,
            js_content: response.data.js_content,
            project_name: response.data.project_name,
            description: response.data.description,
            metadata: response.data.metadata,
            last_modified: response.data.last_modified,
            project_id: response.data.project_id
          }
        };
      } else {
        throw new Error(response.data.message || 'Load failed');
      }
    } catch (error) {
      console.error('❌ Project load error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to load project'
      );
    }
  }

  /**
   * List user projects with pagination and search
   */
  async listProjects({ limit = 10, offset = 0, search = '' } = {}) {
    try {
      console.log('📋 Fetching project list...', { limit, offset, search });
      
      const params = new URLSearchParams({ limit, offset });
      if (search) params.append('search', search);
      
      const response = await api.get(`/projects?${params}`);

      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.projects.length} projects`);
        return {
          success: true,
          projects: response.data.projects,
          total: response.data.total,
          hasMore: response.data.has_more
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('❌ Project list error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to fetch projects'
      );
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    try {
      console.log('🗑️ Deleting project...', projectId);
      
      const response = await api.delete(`/projects/${projectId}`);

      if (response.data.success) {
        console.log('✅ Project deleted successfully');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ Project delete error:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to delete project'
      );
    }
  }

  // ========== AUTO-SAVE FUNCTIONALITY ==========

  /**
   * Auto-save current state
   */
  async autoSaveState({
    sessionId,
    htmlContent,
    cssContent = '',
    jsContent = '',
    cursorPosition = {},
    scrollPosition = {}
  }) {
    if (this.isAutoSaving) return;
    
    try {
      this.isAutoSaving = true;
      console.log('⏰ Auto-saving state...', sessionId);
      
      const response = await api.post('/autosave', {
        session_id: sessionId,
        html_content: htmlContent,
        css_content: cssContent,
        js_content: jsContent,
        cursor_position: cursorPosition,
        scroll_position: scrollPosition
      });

      if (response.data.success) {
        console.log('✅ Auto-save completed');
        return {
          success: true,
          lastSaved: new Date(response.data.last_saved)
        };
      }
    } catch (error) {
      console.warn('⚠️ Auto-save failed:', error.message);
      // Don't throw for auto-save failures
      return { success: false, error: error.message };
    } finally {
      this.isAutoSaving = false;
    }
  }

  /**
   * Restore auto-saved state
   */
  async restoreState(sessionId) {
    try {
      console.log('🔄 Restoring auto-saved state...', sessionId);
      
      const response = await api.post('/restore', {
        session_id: sessionId
      });

      if (response.data.success) {
        console.log('✅ State restored successfully');
        return {
          success: true,
          data: {
            html_content: response.data.html_content,
            css_content: response.data.css_content,
            js_content: response.data.js_content,
            cursor_position: response.data.cursor_position,
            scroll_position: response.data.scroll_position,
            last_modified: response.data.last_modified
          }
        };
      } else {
        return { success: false, message: 'No auto-save state found' };
      }
    } catch (error) {
      console.warn('⚠️ State restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave(getStateCallback) {
    if (this.autoSaveTimer) {
      this.stopAutoSave();
    }

    console.log('🚀 Starting auto-save timer...');
    
    this.autoSaveTimer = setInterval(async () => {
      try {
        const currentState = getStateCallback();
        
        if (currentState.hasUnsavedChanges && currentState.sessionId) {
          await this.autoSaveState({
            sessionId: currentState.sessionId,
            htmlContent: currentState.htmlContent,
            cssContent: currentState.cssContent,
            jsContent: currentState.jsContent,
            cursorPosition: currentState.cursorPosition,
            scrollPosition: currentState.scrollPosition
          });
        }
      } catch (error) {
        console.warn('⚠️ Auto-save interval error:', error);
      }
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('🛑 Auto-save timer stopped');
    }
  }

  // ========== EXIT WARNING SYSTEM ==========

  /**
   * Check for unsaved changes before exit
   */
  async checkUnsavedChanges(sessionId, currentContent = '') {
    try {
      console.log('🔍 Checking for unsaved changes...', sessionId);
      
      const response = await api.post('/check-unsaved', {
        session_id: sessionId,
        has_unsaved_changes: true,
        current_content: currentContent
      });

      return {
        shouldWarn: response.data.should_warn,
        message: response.data.message,
        unsavedChangesCount: response.data.unsaved_changes_count
      };
    } catch (error) {
      console.warn('⚠️ Unsaved changes check failed:', error);
      // Default to showing warning if check fails
      return {
        shouldWarn: true,
        message: 'Unable to check for unsaved changes. Consider saving before exiting.',
        unsavedChangesCount: 0
      };
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const projects = await this.listProjects({ limit: 1000 });
      
      return {
        totalProjects: projects.total,
        totalSize: projects.projects.reduce((sum, p) => sum + (p.file_size || 0), 0),
        lastActivity: projects.projects[0]?.last_modified || null
      };
    } catch (error) {
      return {
        totalProjects: 0,
        totalSize: 0,
        lastActivity: null
      };
    }
  }

  /**
   * Clean up old auto-save states
   */
  async cleanupAutoSaves() {
    // This would be handled by the backend automatically
    // but we can call it if needed
    console.log('🧹 Auto-save cleanup handled by backend');
  }

  /**
   * Validate project data before save
   */
  validateProjectData(data) {
    const errors = [];
    
    if (!data.htmlContent || data.htmlContent.trim().length === 0) {
      errors.push('HTML content is required');
    }
    
    if (!data.sessionId) {
      errors.push('Session ID is required');
    }
    
    if (data.projectName && data.projectName.length > 100) {
      errors.push('Project name must be less than 100 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ========== LOCAL STORAGE CLEANUP ==========

  /**
   * Remove all localStorage data related to the old system
   */
  clearLegacyLocalStorage() {
    const keysToRemove = [
      'voice-website-html-content',
      'voice-website-session-id',
      'voice-website-last-saved',
      'voice-website-project-data',
      'voice-website-auto-save',
      'editor-content',
      'editor-state',
      'website-generator-data'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Legacy localStorage data cleared');
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService; 