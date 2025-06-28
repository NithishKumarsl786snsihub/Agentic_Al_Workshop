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
  type: 'confirmation' | 'clarification';
  message: string;
  summary: string;
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

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add auth token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
      console.log('🔐 Adding auth token to request:', endpoint);
    } else {
      console.warn('⚠️ No auth token found for request:', endpoint);
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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
}

export const apiService = new ApiService();