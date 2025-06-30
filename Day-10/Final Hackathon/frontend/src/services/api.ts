const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GenerateRequest {
  prompt: string;
  session_id?: string;
}

export interface GenerateResponse {
  html_content: string;
  session_id: string;
  filename: string;
  success: boolean;
  message: string;
}

export interface EditRequest {
  html_content: string;
  edit_command: string;
  session_id: string;
}

export interface IntelligentResponse {
  type: 'confirmation' | 'clarification' | 'error_assistance' | 'smart_assistant';
  message: string;
  summary?: string;
  suggestions?: string[];
  options?: string[];
  follow_up_question?: string;
  original_command?: string;
  editable: boolean;
  language: string;
  voice_friendly: boolean;
  metadata: {
    intent?: string;
    confidence?: number;
    context_used?: boolean;
    clarification_needed?: boolean;
    error?: string;
    website_type?: string;
    timestamp?: string;
    error_type?: string;
    processing_method?: string;
    langgraph_used?: boolean;
    edit_success?: boolean;
    changes_applied?: string[];
    validation_score?: number;
    warnings?: string[];
    agent_errors?: string[];
    processing_time?: number;
  };
}

export interface EditResponse {
  html_content: string;
  success: boolean;
  message: string;
  changes_made: string[];
  intelligent_response?: IntelligentResponse;
}

export interface SaveRequest {
  html_content: string;
  session_id: string;
  filename?: string;
}

export interface SaveResponse {
  filename: string;
  file_path: string;
  success: boolean;
  message: string;
}

// NEW: Enhanced editor save interfaces
export interface EditorSaveRequest {
  session_id: string;
  html_content: string;
  project_id?: string;
  project_name?: string;
  description?: string;
  auto_save?: boolean;
}

export interface EditorSaveResponse {
  success: boolean;
  message: string;
  project_id: string;
  project_name: string;
  saved_at: string;
  version: number;
}

export interface UndoRedoRequest {
  session_id: string;
}

export interface UndoRedoResponse {
  html_content: string;
  success: boolean;
  message: string;
  can_undo: boolean;
  can_redo: boolean;
}

export interface SaveConversationRequest {
  final_prompt: string;
  session_id?: string;
  project_id?: string;
  website_type?: string;
  metadata?: Record<string, any>;
}

export interface ConversationResponse {
  success: boolean;
  conversation_id?: string;
  message: string;
  analysis?: Record<string, any>;
}

export interface ConversationListResponse {
  conversations: Array<{
    id: string;
    prompt: string;
    website_type: string;
    created_at: string;
    analysis: Record<string, any>;
  }>;
  total: number;
  success: boolean;
}

// Project management interfaces
export interface Project {
  project_id: string;
  project_name: string;
  description: string;
  created_at: string;
  last_modified: string;
  file_size: number;
  version: number;
  tags: string[];
  is_auto_save: boolean;
  html_content: string;
  preview_image?: string;  // Base64 full preview image
  thumbnail_image?: string;  // Base64 thumbnail image
}

export interface ProjectListResponse {
  success: boolean;
  projects: Project[];
  total: number;
  has_more: boolean;
}

export interface LoadProjectResponse {
  success: boolean;
  html_content: string;
  css_content?: string;
  js_content?: string;
  project_name?: string;
  description?: string;
  metadata?: Record<string, any>;
  last_modified: string;
  project_id: string;
}

interface PreviewParams {
  html_content: string;
  project_id: string;
}

interface PreviewResponse {
  full: string;
  thumbnail: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add auth token if available and not skipped
    if (!skipAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        defaultOptions.headers = {
          ...defaultOptions.headers,
          'Authorization': `Bearer ${token}`,
        };
      } else {
        console.warn('⚠️ No auth token found for request:', endpoint);
      }
    }

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      // Handle token expiration
      if (response.status === 401 && !skipAuth) {
        console.log('🔄 Token expired, attempting refresh...');
        
        try {
          // Try to refresh token
          const { authService } = await import('./authService');
          await authService.refreshToken();
          
          // Retry the original request with new token
          const newToken = localStorage.getItem('access_token');
          if (newToken) {
            const retryResponse = await fetch(url, {
              ...defaultOptions,
              ...options,
              headers: {
                ...defaultOptions.headers,
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            });
            
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Don't throw here, let the original error be handled
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Provide better error messages for common status codes
        let errorMessage = errorData.detail || errorData.message || `Request failed`;
        
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async generateWebsite(request: GenerateRequest): Promise<GenerateResponse> {
    return this.makeRequest<GenerateResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async editWebsite(request: EditRequest): Promise<EditResponse> {
    return this.makeRequest<EditResponse>('/edit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async saveWebsite(request: SaveRequest): Promise<SaveResponse> {
    return this.makeRequest<SaveResponse>('/save', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // NEW: Enhanced save method for editor with MongoDB storage
  async saveFromEditor(request: EditorSaveRequest): Promise<EditorSaveResponse> {
    return this.makeRequest('/editor/save', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async undoChange(request: UndoRedoRequest): Promise<UndoRedoResponse> {
    return this.makeRequest<UndoRedoResponse>('/undo', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async redoChange(request: UndoRedoRequest): Promise<UndoRedoResponse> {
    return this.makeRequest<UndoRedoResponse>('/redo', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Aliases for editor compatibility
  async undoEdit(request: UndoRedoRequest): Promise<UndoRedoResponse> {
    return this.undoChange(request);
  }

  async redoEdit(request: UndoRedoRequest): Promise<UndoRedoResponse> {
    return this.redoChange(request);
  }

  async getSessionHistory(sessionId: string): Promise<any> {
    return this.makeRequest(`/sessions/${sessionId}/history`);
  }

  getDownloadUrl(sessionId: string, filename: string): string {
    return `${this.baseUrl}/download/${sessionId}/${filename}`;
  }

  async healthCheck(): Promise<any> {
    return this.makeRequest('/');
  }

  // Conversation methods
  async saveConversation(request: SaveConversationRequest): Promise<ConversationResponse> {
    return this.makeRequest<ConversationResponse>('/conversations/save', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserConversations(limit: number = 20, offset: number = 0): Promise<ConversationListResponse> {
    return this.makeRequest<ConversationListResponse>(`/conversations?limit=${limit}&offset=${offset}`);
  }

  async searchConversations(query: string, limit: number = 10): Promise<ConversationListResponse> {
    return this.makeRequest<ConversationListResponse>(`/conversations/search?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Project management methods
  async getUserProjects(limit: number = 10, offset: number = 0, search?: string): Promise<ProjectListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return this.makeRequest<ProjectListResponse>(`/projects?${params.toString()}`);
  }

  async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async loadProject(projectId: string): Promise<LoadProjectResponse> {
    return this.makeRequest<LoadProjectResponse>('/projects/load', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async renameProject(projectId: string, newName: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/projects/${projectId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ project_name: newName }),
    });
  }

  async duplicateProject(projectId: string): Promise<{ success: boolean; message: string; project_id?: string }> {
    return this.makeRequest(`/projects/${projectId}/duplicate`, {
      method: 'POST',
    });
  }

  async updateProject(projectId: string, data: {
    html_content?: string;
    project_name?: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate preview images from HTML content
   */
  async generatePreviews(params: PreviewParams): Promise<PreviewResponse> {
    return this.makeRequest<PreviewResponse>('/api/projects/generate-previews', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
}

export const apiService = new ApiService();