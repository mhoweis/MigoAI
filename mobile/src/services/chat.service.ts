// src/services/chat.service.ts
import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  suggestedEvents?: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    startDate: string;
    venue: string;
    city: string;
    priceRange: string;
    imageUrl?: string;
  }>;
  suggestions?: string[];
  nextQuestions?: string[];
  timestamp: Date;
}

class ChatService {
  private sessionId: string | null = null;
  private messageHistory: ChatMessage[] = [];

  async initializeConversation(): Promise<void> {
    try {
      const response = await api.post('/ai/chat/initialize', {}, { timeout: 60000 });
      const data = response.data?.data;
      this.sessionId = data?.sessionId || null;
      this.messageHistory = [];
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      // Create a local session ID so chat still works with fallback responses
      this.sessionId = `local-${Date.now()}`;
    }
  }

  async sendMessage(userMessage: string): Promise<ChatResponse> {
    try {
      // Ensure we have a session
      if (!this.sessionId) {
        await this.initializeConversation();
      }

      // Add user message to local history
      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      this.messageHistory.push(userMsg);

      // Send to backend — POST /api/ai/chat (longer timeout for Ollama)
      const response = await api.post('/ai/chat', {
        message: userMessage,
        sessionId: this.sessionId,
      }, { timeout: 120000 });

      const data = response.data?.data;

      // Map backend response shape to ChatResponse
      const aiResponse: ChatResponse = {
        message: data?.response || "I'm here to help you find great events!",
        suggestions: data?.suggestions,
        nextQuestions: data?.nextQuestions,
        timestamp: new Date(),
      };

      // Map enriched recommendations to suggestedEvents
      if (data?.recommendations && data.recommendations.length > 0) {
        aiResponse.suggestedEvents = data.recommendations
          .filter((rec: any) => rec.title) // only include ones with real event data
          .map((rec: any) => ({
            id: rec.eventId,
            title: rec.title,
            category: rec.category || 'Event',
            description: rec.reason || '',
            startDate: rec.date || new Date().toISOString(),
            venue: rec.venue || 'TBA',
            city: rec.city || 'Dubai',
            priceRange: rec.price || 'See details',
            imageUrl: rec.coverImage || undefined,
          }));
      }

      // Add AI response to local history
      this.messageHistory.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: aiResponse.timestamp,
      });

      return aiResponse;

    } catch (error: any) {
      console.error('Error sending message:', error);

      // Fallback response if AI service is unavailable
      return {
        message: "I apologize, but I'm currently unable to process your request. Please try again in a few moments, or check your internet connection.",
        timestamp: new Date(),
      };
    }
  }

  async getConversationHistory(): Promise<ChatMessage[]> {
    if (!this.sessionId) {
      await this.initializeConversation();
    }
    return this.messageHistory;
  }

  async clearConversation(): Promise<void> {
    try {
      if (this.sessionId) {
        await api.post('/ai/chat/clear', { sessionId: this.sessionId });
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
    } finally {
      this.sessionId = null;
      this.messageHistory = [];
    }
  }

  async getQuickSuggestions(): Promise<string[]> {
    try {
      const response = await api.get('/ai/chat/suggestions');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [
        "What events are happening this weekend?",
        "Suggest concerts near me",
        "Find free events in my area",
        "What are the best festivals this month?",
        "Help me plan a date night",
      ];
    }
  }
}

export const chatService = new ChatService();
