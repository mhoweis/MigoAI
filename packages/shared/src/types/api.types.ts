/**
 * API request/response types
 */

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

export interface ApiRequestContext {
  userId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime: number;
  services?: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    ai?: 'up' | 'down';
  };
}

// Chat/AI types
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    userId?: string;
    location?: {
      lat: number;
      lng: number;
    };
    interests?: string[];
  };
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestedEvents?: any[];
  timestamp: string;
}
