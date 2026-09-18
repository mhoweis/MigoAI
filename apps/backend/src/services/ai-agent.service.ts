// src/services/ai-agent.service.ts - FIXED WITH CORRECT FIELD NAMES
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import prisma from '../database/prisma';
import { eventService } from './events.service';

// Check if config is default or named export
let config: any;
try {
  // Try default import first
  config = require('../config/env').default || require('../config/env');
} catch (error) {
  // Fallback to process.env
  config = { env: process.env };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface EventContext {
  user: {
    id: string;
    name: string;
    preferences: any;
    location: {
      city: string;
      country: string;
      lat?: number;
      lng?: number;
    };
    interests: string[];
  };
  history: {
    bookings: Array<{ event: any; date: Date }>;
    wishlists: Array<{ event: any; added: Date }>;
    searches: Array<{ query: string; date: Date }>;
  };
  currentDateTime: Date;
  location: {
    city: string;
    country: string;
    radiusKm?: number;
  };
}

interface AIProvider {
  generateResponse(prompt: string, context: any): Promise<any>;
  parseSearchQuery(query: string, context: any): Promise<any>;
}

class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatModel: any;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.env?.GEMINI_API_KEY || config.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: `You are MIGO AI, the intelligent event discovery assistant for the MIGO platform.`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });
  }
  
  async generateResponse(prompt: string, context: any): Promise<any> {
    const result = await this.chatModel.generateContent(prompt);
    const response = await result.response.text();
    return this.parseAIResponse(response);
  }
  
  async parseSearchQuery(query: string, context: any): Promise<any> {
    const prompt = this.buildParseQueryPrompt(query, context);
    const result = await this.model.generateContent(prompt);
    const response = await result.response.text();
    return this.parseQueryResponse(response);
  }
  
  private parseAIResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        response: response,
        recommendations: [],
        suggestions: [],
        nextQuestions: [],
        data: {},
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        response: response,
        recommendations: [],
        suggestions: [],
        nextQuestions: [],
        data: {},
      };
    }
  }
  
  private buildParseQueryPrompt(query: string, context: any): string {
    return `Parse this natural language event search query: "${query}"`;
  }
  
  private parseQueryResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        categories: [],
        dateRange: {},
        priceRange: {},
        location: { city: 'Dubai' },
        keywords: [],
        requirements: []
      };
    }
  }
}

class OllamaProvider implements AIProvider {
  async generateResponse(prompt: string, context: any): Promise<any> {
    try {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'llama3.2';
      
      const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 512,
            num_ctx: 2048,
          },
          format: 'json',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      
      const data = await response.json() as { response?: string };
      
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(data.response);
        return {
          response: parsed.response || data.response,
          recommendations: parsed.recommendations || [],
          suggestions: parsed.suggestions || [],
          nextQuestions: parsed.nextQuestions || [],
          data: parsed.data || {},
        };
      } catch {
        // If not JSON, use the raw response
        return {
          response: data.response,
          recommendations: [],
          suggestions: [],
          nextQuestions: [],
          data: {},
        };
      }
    } catch (error) {
      console.error('Ollama generation error:', error);
      return {
        response: "I'm currently experiencing technical difficulties. Please try again or use the search feature to find events manually.",
        recommendations: [],
        suggestions: ["Try the search feature", "Browse categories"],
        nextQuestions: ["What type of event are you looking for?", "When would you like to attend?"],
        data: {},
      };
    }
  }
  
  async parseSearchQuery(query: string, context: any): Promise<any> {
    try {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'llama3.2';
      
      const prompt = this.buildParseQueryPrompt(query, context);
      
      const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 512,
          },
          format: 'json',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }
      
      const data = await response.json() as { response?: string };
      
      try {
        return JSON.parse(data.response);
      } catch {
        return this.getDefaultQueryResponse(context);
      }
    } catch (error) {
      console.error('Ollama parse query error:', error);
      return this.getDefaultQueryResponse(context);
    }
  }
  
  private buildParseQueryPrompt(query: string, context: any): string {
    const now = new Date();
    const weekendStart = this.getWeekendStart();
    const weekendEnd = this.getWeekendEnd();
    
    return `Parse this natural language event search query: "${query}"
    
User Context:
- Location: ${context?.user?.location?.city || 'Dubai'}, ${context?.user?.location?.country || 'UAE'}
- Current Date: ${now.toISOString()}

Extract the following information as JSON:
1. Categories (array of event categories)
2. Date range (start and end dates)
3. Price range (min and max)
4. Location (city, radius in km)
5. Keywords (array of search terms)
6. Special requirements (pet-friendly, wheelchair accessible, etc.)

Today's date: ${now.toISOString().split('T')[0]}
Weekend dates: ${weekendStart.toISOString().split('T')[0]} to ${weekendEnd.toISOString().split('T')[0]}

Return ONLY valid JSON with this structure:
{
  "categories": [],
  "dateRange": {},
  "priceRange": {},
  "location": {},
  "keywords": [],
  "requirements": []
}`;
  }
  
  private getDefaultQueryResponse(context: any): any {
    return {
      categories: [],
      dateRange: {},
      priceRange: {},
      location: {
        city: context?.user?.location?.city || 'Dubai',
        radius: 50
      },
      keywords: [],
      requirements: []
    };
  }
  
  // Weekend in UAE/Dubai = Friday, Saturday, Sunday
  private getWeekendStart(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat
    let diff: number;
    if (day === 5) diff = 0;       // today is Friday
    else if (day === 6) diff = -1; // today is Saturday — Friday was yesterday
    else if (day === 0) diff = -2; // today is Sunday   — Friday was 2 days ago
    else diff = 5 - day;           // Mon–Thu: days until next Friday
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + diff);
    weekendStart.setHours(0, 0, 0, 0);
    return weekendStart;
  }

  private getWeekendEnd(): Date {
    const weekendStart = this.getWeekendStart();
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 2); // Fri + 2 = Sunday
    weekendEnd.setHours(23, 59, 59, 999);
    return weekendEnd;
  }
}

export class MigoAIAgent {
  private aiProvider: AIProvider;
  private systemPrompt: string;
  
  constructor() {
    const provider = process.env.AI_PROVIDER || 'gemini';
    
    switch (provider.toLowerCase()) {
      case 'ollama':
        this.aiProvider = new OllamaProvider();
        console.log('Using Ollama provider with base URL:', process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
        break;
      case 'gemini':
      default:
        const apiKey = config.env?.GEMINI_API_KEY || config.GEMINI_API_KEY;
        if (!apiKey) {
          console.warn('GEMINI_API_KEY not found, falling back to Ollama');
          this.aiProvider = new OllamaProvider();
          console.log('Using Ollama provider (fallback)');
        } else {
          this.aiProvider = new GeminiProvider();
          console.log('Using Gemini provider');
        }
    }
    
    this.systemPrompt = `You are MIGO AI, the intelligent event discovery assistant for the MIGO platform.

RULES AND RESTRICTIONS:
1. **Stay Formal**: Always maintain professional tone. No slang, emojis, or informal language.
2. **Event Focus**: Only discuss event-related topics. Redirect non-event questions politely.
3. **Safety First**: Never suggest illegal, dangerous, or inappropriate events.
4. **Fact-Based**: Only recommend real, verified events from the database.
5. **Privacy**: Never ask for personal information beyond event preferences.
6. **No Recommendations**: For paid events, always redirect to official sources.
7. **Professional Boundaries**: Do not engage in personal conversations.
8. **Accessibility**: Consider suggesting accessible events when relevant.

PERSONALIZATION: Use the user's context to provide tailored recommendations.

CAPABILITIES:
1. Find events by category, date, location, or price
2. Suggest events based on user interests
3. Provide event details and logistics
4. Compare similar events
5. Help with event planning
6. Explain event categories or types
7. Provide venue information
8. Suggest event combinations
9. Budget planning for events
10. Seasonal event recommendations`;
  }
  
  async initializeSession(userId: string): Promise<string> {
    const sessionId = `chat_${Date.now()}_${userId.substring(0, 8)}`;
    try {
      await prisma.chatSession.create({
        data: { sessionId, userId },
      });
    } catch (err) {
      // DB table may not exist yet (migration pending) — return in-memory session ID
      console.warn('[AI] ChatSession create failed, using in-memory session:', (err as any)?.message);
    }
    return sessionId;
  }
  
  public async getUserContext(userId: string): Promise<EventContext> {
    const [user, bookings, wishlists, recentSearches] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          preferences: true,
          interests: true,
        }
      }),
      prisma.booking.findMany({
        where: { userId },
        orderBy: { bookingDate: 'desc' }, // FIXED: Changed to bookingDate
        take: 20,
      }),
      prisma.wishlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }, // CORRECT: Wishlist has createdAt
        take: 20,
      }),
      prisma.searchLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }, // CORRECT: SearchLog has createdAt
        take: 10,
      }),
    ]);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get event details for bookings and wishlists
    const bookingEvents = await Promise.all(
      bookings.map(async (b) => {
        const event = await prisma.event.findUnique({
          where: { id: b.eventId },
          select: {
            id: true,
            title: true,
            category: true,
            startDate: true,
            venueName: true,
            city: true,
            country: true,
          }
        });
        return { event, date: b.bookingDate }; // FIXED: Changed to bookingDate
      })
    );
    
    const wishlistEvents = await Promise.all(
      wishlists.map(async (w) => {
        const event = await prisma.event.findUnique({
          where: { id: w.eventId },
          select: {
            id: true,
            title: true,
            category: true,
            startDate: true,
            venueName: true,
            city: true,
            country: true,
          }
        });
        return { event, added: w.createdAt }; // CORRECT: Wishlist has createdAt
      })
    );
    
    // Parse interests from JSON to string array
    let userInterests: string[] = [];
    if (user.interests) {
      try {
        if (typeof user.interests === 'string') {
          userInterests = JSON.parse(user.interests);
        } else if (Array.isArray(user.interests)) {
          userInterests = user.interests.filter(item => typeof item === 'string');
        }
      } catch (error) {
        console.warn('Failed to parse user interests:', error);
      }
    }
    
    return {
      user: {
        id: user.id,
        name: user.displayName || user.name || 'User',
        preferences: user.preferences || {},
        location: {
          city: 'Dubai',
          country: 'UAE',
        },
        interests: userInterests,
      },
      history: {
        bookings: bookingEvents.filter(b => b.event),
        wishlists: wishlistEvents.filter(w => w.event),
        searches: recentSearches.map(s => ({
          query: s.query,
          date: s.createdAt, // CORRECT: SearchLog has createdAt
        })),
      },
      currentDateTime: new Date(),
      location: {
        city: 'Dubai',
        country: 'UAE',
        radiusKm: 50,
      },
    };
  }
  
  async chat(sessionId: string, userMessage: string, userId: string): Promise<{
    response: string;
    recommendations: Array<{ eventId: string; reason: string; confidence: number }>;
    suggestions: string[];
    nextQuestions: string[];
    data?: any;
  }> {
    // Load session from DB (may not exist if tables are missing or ID is stale)
    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    }).catch(() => null); // DB table may not exist

    // Get user context — fall back to a minimal context if user lookup fails
    let context: EventContext;
    try {
      context = await this.getUserContext(userId);
    } catch {
      context = {
        user: { id: userId, name: 'User', preferences: {}, location: { city: 'Dubai', country: 'UAE' }, interests: [] },
        history: { bookings: [], wishlists: [], searches: [] },
        currentDateTime: new Date(),
        location: { city: 'Dubai', country: 'UAE', radiusKm: 50 },
      };
    }
    
    // If the user is asking about the weekend, pre-filter events to Fri–Sun
    const isWeekendQuery = /weekend|friday|saturday|sunday|\bfri\b|\bsat\b|\bsun\b/i.test(userMessage);
    const weekendFilter = isWeekendQuery
      ? { start: this.getWeekendStart(), end: this.getWeekendEnd() }
      : undefined;

    // Get relevant events based on user's location (and optional date filter)
    const events = await this.getRelevantEvents(context, weekendFilter);

    // Prepare conversation history (empty if session is missing/new)
    const history: ChatMessage[] = (session?.messages || []).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.createdAt,
    }));
    
    // Build the prompt — returns prompt string and short-ID → UUID map
    const { prompt, eventIdMap } = this.buildPrompt(userMessage, context, events, history);

    try {
      const startTime = Date.now();

      // Use the selected AI provider
      const aiResponse = await this.aiProvider.generateResponse(prompt, context);
      const aiResponseTime = Date.now() - startTime;

      // Translate short refs (E1, E2…) back to real UUIDs
      if (aiResponse.recommendations) {
        aiResponse.recommendations = aiResponse.recommendations.map((rec: any) => ({
          ...rec,
          eventId: eventIdMap[rec.eventId] || rec.eventId,
        }));
      }

      // Enrich recommendations with real event data (title, coverImage, etc.)
      if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
        const eventIds = aiResponse.recommendations
          .map((r: any) => r.eventId)
          .filter(Boolean);
        if (eventIds.length > 0) {
          const eventDetails = await prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: {
              id: true,
              title: true,
              category: true,
              startDate: true,
              venueName: true,
              city: true,
              priceFrom: true,
              priceTo: true,
              isFree: true,
              coverImage: true,
            },
          });
          aiResponse.recommendations = aiResponse.recommendations.map((rec: any) => {
            const ev = eventDetails.find((e: any) => e.id === rec.eventId);
            return {
              ...rec,
              title: ev?.title,
              category: ev?.category,
              date: ev?.startDate,
              venue: ev?.venueName,
              city: ev?.city,
              price: ev?.isFree ? 'Free' : `${ev?.priceFrom || 0} AED`,
              coverImage: ev?.coverImage,
            };
          });
        }
      }

      // Save the conversation (best-effort — skip if session or tables are missing)
      if (session) {
        try {
          await prisma.$transaction([
            prisma.chatMessage.create({
              data: {
                sessionId: session.id,
                role: 'user',
                content: userMessage,
                tokens: Math.ceil(userMessage.length / 4),
              }
            }),
            prisma.chatMessage.create({
              data: {
                sessionId: session.id,
                role: 'assistant',
                content: aiResponse.response,
                tokens: Math.ceil(aiResponse.response.length / 4),
                aiModel: process.env.AI_PROVIDER === 'ollama'
                  ? process.env.OLLAMA_MODEL
                  : 'gemini-1.5-pro',
                aiResponseTime,
                aiUsage: {
                  promptTokens: Math.ceil(prompt.length / 4),
                  completionTokens: Math.ceil(aiResponse.response.length / 4),
                  totalTokens: Math.ceil((prompt.length + aiResponse.response.length) / 4),
                },
                context: {
                  recommendations: aiResponse.recommendations,
                  suggestions: aiResponse.suggestions,
                } as any,
              }
            }),
            prisma.chatSession.update({
              where: { id: session.id },
              data: {
                messageCount: { increment: 2 },
                tokenCount: { increment: Math.ceil((userMessage.length + aiResponse.response.length) / 4) },
                durationMinutes: { increment: Math.ceil(aiResponseTime / 60000) },
                lastMessageAt: new Date(),
                updatedAt: new Date(),
              }
            })
          ]);
        } catch (saveErr) {
          console.warn('[AI] Failed to save chat messages to DB:', (saveErr as any)?.message);
        }
      }
      
      return aiResponse;
      
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback response
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment or try rephrasing your question.",
        recommendations: [],
        suggestions: ["Try searching for events using the search bar", "Check out today's featured events", "Browse events by category"],
        nextQuestions: ["What type of events are you interested in?", "When are you looking for events?", "What's your budget range?"],
      };
    }
  }
  
private async getRelevantEvents(
  context: EventContext,
  dateFilter?: { start: Date; end: Date },
): Promise<any[]> {
  const city = context?.user?.location?.city || 'Dubai';
  const now = new Date();

  const buildWhere = (df?: { start: Date; end: Date }): any => ({
    AND: [
      // City match (broad — includes null/empty city too)
      { OR: [{ city: { contains: city } }, { city: null }, { city: '' }] },
      // Date filter
      df
        ? { startDate: { gte: df.start, lte: df.end } }
        : { startDate: { gte: now } },
    ],
  });

  const eventSelect = {
    id: true,
    title: true,
    category: true,
    subcategory: true,
    startDate: true,
    endDate: true,
    venueName: true,
    city: true,
    country: true,
    priceFrom: true,
    priceTo: true,
    isFree: true,
    coverImage: true,
    tags: true,
    ageRestriction: true,
    isPetFriendly: true,
    facilities: true,
    ratingAverage: true,
    wishlistCount: true,
  };

  let events = await prisma.event.findMany({
    where: buildWhere(dateFilter),
    orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
    take: 50,
    select: eventSelect,
  });

  // If weekend filter returned nothing, fall back to all upcoming events so the AI
  // always has something to recommend rather than an empty list.
  if (dateFilter && events.length === 0) {
    console.log('[AI] No events found for date range, falling back to all upcoming events');
    events = await prisma.event.findMany({
      where: buildWhere(),
      orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
      take: 50,
      select: eventSelect,
    });
  }

  return events;
}
  
  private buildPrompt(
    userMessage: string,
    context: EventContext,
    events: any[],
    history: ChatMessage[]
  ): { prompt: string; eventIdMap: Record<string, string> } {
    const today = new Date().toISOString().split('T')[0];
    const weekendStart = this.getWeekendStart();
    const weekendEnd = this.getWeekendEnd();
    const weekendLabel = `${weekendStart.toLocaleDateString()} – ${weekendEnd.toLocaleDateString()} (Fri–Sun)`;
    // Pick up to 6 events with category diversity: max 2 from the same category
    const topEvents = (() => {
      const counts: Record<string, number> = {};
      const result: typeof events = [];
      for (const e of events) {
        const cat = (e.category || 'Other') as string;
        if ((counts[cat] ?? 0) < 2 && result.length < 6) {
          result.push(e);
          counts[cat] = (counts[cat] ?? 0) + 1;
        }
      }
      return result;
    })();

    // Use short refs (E1–E6) so the model never sees raw UUIDs
    const eventIdMap: Record<string, string> = {};
    const eventList = topEvents.length > 0
      ? topEvents.map((e, i) => {
          const ref = `E${i + 1}`;
          eventIdMap[ref] = e.id;
          const date = e.startDate ? new Date(e.startDate).toLocaleDateString() : 'TBA';
          const price = e.isFree ? 'Free' : `${e.priceFrom || 0} AED`;
          return `${ref} | ${e.title} | ${e.category} | ${date} | ${e.venueName || 'TBA'} | ${price}`;
        }).join('\n')
      : 'No events found for this period';

    const recentChat = history.slice(-2)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `You are MIGO AI, a friendly event discovery assistant. Reply ONLY with valid JSON.

User: ${context.user.name} | Interests: ${context.user.interests.join(', ') || 'general'} | Location: ${context.user.location.city}
Today: ${today} | Weekend: ${weekendLabel}

AVAILABLE EVENTS:
${eventList}

${recentChat ? `RECENT CHAT:\n${recentChat}\n` : ''}User message: "${userMessage}"

Reply with JSON only (no markdown, no extra text):
{"response":"friendly reply in 1-2 sentences — mention events by NAME only, never by ID","recommendations":[{"eventId":"E1","reason":"brief reason"},{"eventId":"E2","reason":"brief reason"},{"eventId":"E3","reason":"brief reason"}],"suggestions":["short follow-up"]}

Rules:
- Always include at least 3 recommendations if events are available.
- Pick events from different categories when possible — no more than 2 from the same category.
- Use only short refs (E1, E2…) in the eventId field. Never paste IDs or database codes in the response text.
- Keep response text under 80 words.`;

    return { prompt, eventIdMap };
  }
  
  // Weekend in UAE/Dubai = Friday, Saturday, Sunday
  private getWeekendStart(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat
    let diff: number;
    if (day === 5) diff = 0;       // today is Friday
    else if (day === 6) diff = -1; // today is Saturday — Friday was yesterday
    else if (day === 0) diff = -2; // today is Sunday   — Friday was 2 days ago
    else diff = 5 - day;           // Mon–Thu: days until next Friday
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + diff);
    weekendStart.setHours(0, 0, 0, 0);
    return weekendStart;
  }

  private getWeekendEnd(): Date {
    const weekendStart = this.getWeekendStart();
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 2); // Fri + 2 = Sunday
    weekendEnd.setHours(23, 59, 59, 999);
    return weekendEnd;
  }
  
  async processChatMessage(userId: string, sessionId: string | undefined, message: string): Promise<any> {
    let resolvedSessionId = sessionId;

    // Verify the session exists in DB; if not (or no session given), create a fresh one
    if (resolvedSessionId) {
      const exists = await prisma.chatSession.findUnique({ where: { sessionId: resolvedSessionId } }).catch(() => null);
      if (!exists) resolvedSessionId = undefined;
    }

    if (!resolvedSessionId) {
      resolvedSessionId = await this.initializeSession(userId);
    }

    return this.chat(resolvedSessionId, message, userId);
  }

  async getConversationStarters(userId: string): Promise<string[]> {
    return [
      "What events are happening this weekend?",
      "Suggest events based on my interests",
      "Find free events near me",
      "What are the most popular events right now?",
      "Help me plan a date night",
      "Show me upcoming music festivals",
      "What tech events are available?",
      "Find family-friendly events this weekend",
    ];
  }

  async getChatHistory(userId: string, sessionId?: string, limit: number = 20): Promise<any[]> {
    const sessions = await prisma.chatSession.findMany({
      where: sessionId ? { userId, sessionId } : { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' }, // CORRECT: ChatMessage has createdAt
          take: 10,
          select: {
            role: true,
            content: true,
            createdAt: true,
          }
        }
      }
    });
    
    return sessions.map(session => ({
      sessionId: session.sessionId,
      title: session.title || 'Chat Session',
      lastMessageAt: session.lastMessageAt,
      messageCount: session.messageCount,
      messages: session.messages.reverse().map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    }));
  }
  
  async clearChatHistory(userId: string, sessionId?: string): Promise<void> {
    await prisma.chatSession.updateMany({
      where: sessionId ? { userId, sessionId } : { userId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      }
    });
  }
  
  async processNaturalLanguageSearch(userId: string, query: string): Promise<{
    events: any[];
    filters: any;
    suggestions: string[];
  }> {
    let context: EventContext | null = null;

    try {
      context = await this.getUserContext(userId);
    } catch (error) {
      context = {
        user: {
          id: userId || 'guest',
          name: 'Guest',
          preferences: {},
          location: { city: 'Dubai', country: 'UAE' },
          interests: [],
        },
        history: { bookings: [], wishlists: [], searches: [] },
        currentDateTime: new Date(),
        location: { city: 'Dubai', country: 'UAE', radiusKm: 50 },
      };
    }
    
    // Parse the natural language query using the AI provider
    const parsedQuery = await this.aiProvider.parseSearchQuery(query, context);
    
    // Search for events using the parsed query
    const events = await eventService.searchEvents(parsedQuery);
    
    // Generate suggestions based on the search
    const suggestions = this.generateSearchSuggestions(query, events.length);
    
    return {
      events: events.slice(0, 20),
      filters: parsedQuery,
      suggestions,
    };
  }
  
  private generateSearchSuggestions(query: string, resultCount: number): string[] {
    const suggestions: string[] = [];
    
    if (resultCount === 0) {
      suggestions.push(
        'Try broadening your search by removing some filters',
        'Check events in nearby cities',
        'Look for events in different categories'
      );
    } else if (resultCount < 5) {
      suggestions.push(
        'Try searching for similar events',
        'Check out our featured events',
        'Browse events by category'
      );
    } else {
      suggestions.push(
        'Try filtering by date to see upcoming events',
        'Sort by popularity to see what others are attending',
        'Use price filters to find events within your budget'
      );
    }
    
    suggestions.push(
      'Save your favorite events to your wishlist',
      'Set up notifications for new events matching your interests',
      'Share events with friends to coordinate plans'
    );
    
    return suggestions;
  }
  
  async generatePersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const context = await this.getUserContext(userId);
    const events = await this.getRelevantEvents(context);
    
    const scoredEvents = events.map(event => {
      let score = 0.5;
      
      if (context.user.interests.length > 0) {
        const interestMatch = context.user.interests.some(interest => 
          event.tags?.includes(interest.toLowerCase()) ||
          event.category?.toLowerCase().includes(interest.toLowerCase()) ||
          event.subcategory?.toLowerCase().includes(interest.toLowerCase())
        );
        if (interestMatch) score += 0.3;
      }
      
      const eventStartDate = event.startDate ? new Date(event.startDate) : new Date();
      const daysUntilEvent = Math.ceil((eventStartDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent <= 7) score += 0.2;
      
      if (event.ratingAverage && event.ratingAverage >= 4) {
        score += (event.ratingAverage - 4) / 2;
      }
      
      if (event.wishlistCount > 10) {
        score += Math.min(event.wishlistCount / 100, 0.1);
      }
      
      return { ...event, score };
    });
    
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(event => ({
        eventId: event.id,
        title: event.title,
        category: event.category,
        date: event.startDate,
        venue: event.venueName,
        price: event.isFree ? 'Free' : `${event.priceFrom} - ${event.priceTo}`,
        score: event.score,
        reason: this.generateRecommendationReason(event, context),
      }));
  }
  
  private generateRecommendationReason(event: any, context: EventContext): string {
    const reasons = [];
    
    if (context.user.interests.length > 0) {
      const matchedInterests = context.user.interests.filter(interest =>
        event.tags?.includes(interest.toLowerCase()) ||
        event.category?.toLowerCase().includes(interest.toLowerCase()) ||
        event.subcategory?.toLowerCase().includes(interest.toLowerCase())
      );
      if (matchedInterests.length > 0) {
        reasons.push(`Matches your interests in ${matchedInterests.join(', ')}`);
      }
    }
    
    const eventStartDate = event.startDate ? new Date(event.startDate) : new Date();
    const daysUntilEvent = Math.ceil((eventStartDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilEvent <= 3) {
      reasons.push('Happening very soon');
    } else if (daysUntilEvent <= 7) {
      reasons.push('Happening this week');
    } else if (this.isWeekendEvent(eventStartDate)) {
      reasons.push('Perfect for the weekend');
    }
    
    if (event.ratingAverage && event.ratingAverage >= 4) {
      reasons.push(`Highly rated (${event.ratingAverage}/5)`);
    }
    if (event.wishlistCount > 20) {
      reasons.push('Very popular among users');
    }
    
    if (event.city === context.user.location.city) {
      reasons.push('In your city');
    }
    
    if (event.isFree) {
      reasons.push('Free entry');
    } else if (event.priceFrom && event.priceFrom <= 50) {
      reasons.push('Affordable price');
    }
    
    if (reasons.length === 0) {
      reasons.push('Great event based on your activity');
    }
    
    return reasons.join(', ');
  }
  
  private isWeekendEvent(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6 || day === 0;
  }
}

export const migoAIAgent = new MigoAIAgent();