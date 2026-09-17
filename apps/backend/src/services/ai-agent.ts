// src/services/ai-agent.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import prisma from '../database/prisma';
import { Event, User, Booking } from '@prisma/client';
import { eventService } from './events.service';

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
    bookings: Array<{ event: Event; date: Date }>;
    wishlists: Array<{ event: Event; added: Date }>;
    searches: Array<{ query: string; date: Date }>;
  };
  currentDateTime: Date;
  location: {
    city: string;
    country: string;
    radiusKm?: number;
  };
}

export class MigoAIAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatModel: any;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.env.GEMINI_API_KEY);
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
      systemInstruction: `You are MIGO AI, the intelligent event discovery assistant for the MIGO platform.

Your personality:
- Friendly, enthusiastic, and helpful
- Knowledgeable about events, concerts, exhibitions, and local activities
- Respectful of user preferences and privacy
- Always looking for the best matches for each user

Your capabilities:
1. Understand natural language queries about events
2. Provide personalized recommendations based on user history
3. Search for events by category, date, price, location
4. Compare events and highlight key differences
5. Suggest alternatives when requested events aren't available
6. Provide event details, facilities, and practical information

Response format:
Always return valid JSON with this structure:
{
  "response": "Your conversational response to the user",
  "recommendations": [
    {
      "eventId": "string",
      "reason": "Why this event matches the query",
      "confidence": 0.0 to 1.0
    }
  ],
  "suggestions": ["array", "of", "suggestions"],
  "nextQuestions": ["questions to help refine search"],
  "data": {} // Any additional structured data
}`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });
  }
  
  async initializeSession(userId: string): Promise<string> {
    const session = await prisma.chatSession.create({
      data: {
        sessionId: `chat_${Date.now()}_${userId.substring(0, 8)}`,
        userId,
        context: await this.getUserContext(userId),
      }
    });
    
    return session.sessionId;
  }
  
  private async getUserContext(userId: string): Promise<EventContext> {
    const [user, bookings, wishlists, recentSearches] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          preferences: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
          interests: true,
        }
      }),
      prisma.booking.findMany({
        where: { userId },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.wishlist.findMany({
        where: { userId },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.searchLog.findMany({
        where: { userId },
        orderBy: { searchedAt: 'desc' },
        take: 10,
      }),
    ]);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      user: {
        id: user.id,
        name: user.displayName || `${user.firstName} ${user.lastName}`,
        preferences: user.preferences || {},
        location: {
          city: user.city || 'Dubai',
          country: user.country || 'UAE',
          lat: user.latitude,
          lng: user.longitude,
        },
        interests: user.interests || [],
      },
      history: {
        bookings: bookings.map(b => ({
          event: b.event,
          date: b.createdAt,
        })),
        wishlists: wishlists.map(w => ({
          event: w.event,
          added: w.createdAt,
        })),
        searches: recentSearches.map(s => ({
          query: s.query,
          date: s.searchedAt,
        })),
      },
      currentDateTime: new Date(),
      location: {
        city: user.city || 'Dubai',
        country: user.country || 'UAE',
        radiusKm: 50,
      },
    };
  }
  
  async chat(sessionId: string, userMessage: string): Promise<{
    response: string;
    recommendations: Array<{ eventId: string; reason: string; confidence: number }>;
    suggestions: string[];
    nextQuestions: string[];
    data?: any;
  }> {
    const session = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        user: {
          select: {
            city: true,
            country: true,
            interests: true,
          }
        }
      }
    });
    
    if (!session) {
      throw new Error('Chat session not found');
    }
    
    // Get relevant events based on user's location
    const events = await this.getRelevantEvents(session);
    
    // Prepare conversation history
    const history = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
    }));
    
    // Build the prompt
    const prompt = this.buildPrompt(userMessage, session.context as EventContext, events, history);
    
    try {
      const startTime = Date.now();
      const result = await this.chatModel.generateContent(prompt);
      const response = await result.response.text();
      const aiResponseTime = Date.now() - startTime;
      
      // Parse the JSON response
      const parsedResponse = this.parseAIResponse(response);
      
      // Save the conversation
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
            content: parsedResponse.response,
            tokens: Math.ceil(parsedResponse.response.length / 4),
            aiModel: 'gemini-1.5-pro',
            aiResponseTime,
            aiUsage: {
              promptTokens: Math.ceil(prompt.length / 4),
              completionTokens: Math.ceil(parsedResponse.response.length / 4),
              totalTokens: Math.ceil((prompt.length + parsedResponse.response.length) / 4),
            },
            context: {
              recommendations: parsedResponse.recommendations,
              suggestions: parsedResponse.suggestions,
            },
          }
        }),
        prisma.chatSession.update({
          where: { id: session.id },
          data: {
            messageCount: { increment: 2 },
            tokenCount: { increment: Math.ceil((userMessage.length + parsedResponse.response.length) / 4) },
            durationMinutes: { increment: Math.ceil(aiResponseTime / 60000) },
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          }
        })
      ]);
      
      return parsedResponse;
      
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
  
  private async getRelevantEvents(session: any): Promise<any[]> {
    const context = session.context as EventContext;
    const city = context?.user?.location?.city || 'Dubai';
    
    const events = await prisma.event.findMany({
      where: {
        city,
        status: 'ACTIVE',
        startDate: { gte: new Date() },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'UNLISTED' },
        ],
      },
      orderBy: [
        { isFeatured: 'desc' },
        { startDate: 'asc' },
      ],
      take: 50,
      select: {
        id: true,
        migoId: true,
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
      }
    });
    
    return events;
  }
  
  private buildPrompt(
    userMessage: string,
    context: EventContext,
    events: any[],
    history: ChatMessage[]
  ): string {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekendStart = this.getWeekendStart();
    const weekendEnd = this.getWeekendEnd();
    
    return `
# MIGO AI ASSISTANT - EVENT DISCOVERY

## USER PROFILE
- Name: ${context.user.name}
- Location: ${context.user.location.city}, ${context.user.location.country}
- Interests: ${context.user.interests.join(', ') || 'Not specified'}
- Preferences: ${JSON.stringify(context.user.preferences, null, 2)}

## CURRENT CONTEXT
- Current Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Current Time: ${now.toLocaleTimeString()}
- Weekend: ${weekendStart.toLocaleDateString()} to ${weekendEnd.toLocaleDateString()}

## USER HISTORY
### Recent Bookings:
${context.history.bookings.slice(0, 5).map(b => `- ${b.event.title} (${b.date.toLocaleDateString()})`).join('\n') || 'No recent bookings'}

### Wishlisted Events:
${context.history.wishlists.slice(0, 5).map(w => `- ${w.event.title}`).join('\n') || 'No wishlisted events'}

### Recent Searches:
${context.history.searches.slice(0, 5).map(s => `- "${s.query}" (${s.date.toLocaleDateString()})`).join('\n') || 'No recent searches'}

## AVAILABLE EVENTS (${events.length} events in ${context.user.location.city})
${events.slice(0, 20).map(event => this.formatEventForPrompt(event)).join('\n---\n')}

## CONVERSATION HISTORY
${history.slice(-5).map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

## USER'S CURRENT MESSAGE
"${userMessage}"

## YOUR TASK
Analyze the user's message and provide a helpful response. Consider:
1. What is the user looking for? (event type, date, price, location, etc.)
2. Based on their history and preferences, what might they enjoy?
3. What events from the available list match their query?
4. If no perfect matches, suggest alternatives or ask clarifying questions.

## RESPONSE REQUIREMENTS
1. Be conversational and friendly
2. Acknowledge their query and show understanding
3. Provide specific recommendations when possible
4. Include practical details (date, location, price, facilities)
5. Suggest next steps or ask follow-up questions
6. If recommending events, explain why they're good matches

## RESPONSE FORMAT
Return ONLY valid JSON with this exact structure:
{
  "response": "Your conversational reply here...",
  "recommendations": [
    {
      "eventId": "event-id-here",
      "reason": "Why this event matches their query",
      "confidence": 0.95
    }
  ],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "nextQuestions": ["Question 1", "Question 2"],
  "data": {
    "interpretedQuery": {
      "categories": [],
      "dateRange": {},
      "priceRange": {},
      "location": {}
    }
  }
}

IMPORTANT: Only include events that actually exist in the available events list. Do not make up events.
    `;
  }
  
  private formatEventForPrompt(event: any): string {
    return `
Event ID: ${event.migoId || event.id}
Title: ${event.title}
Category: ${event.category}${event.subcategory ? ` (${event.subcategory})` : ''}
Date: ${event.startDate.toLocaleDateString()} at ${event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Venue: ${event.venueName}, ${event.city}
Price: ${event.isFree ? 'Free' : `${event.priceFrom} - ${event.priceTo} ${event.currency}`}
Features: ${event.tags?.join(', ') || 'None'}
Facilities: ${event.facilities?.join(', ') || 'Standard'}
Rating: ${event.ratingAverage ? `${event.ratingAverage}/5` : 'No ratings yet'}
Popularity: ${event.wishlistCount} people have this in wishlist
    `.trim();
  }
  
  private getWeekendStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : 5 - day; // Friday = 5
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + diff);
    weekendStart.setHours(0, 0, 0, 0);
    return weekendStart;
  }
  
  private getWeekendEnd(): Date {
    const weekendStart = this.getWeekendStart();
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 2); // Friday to Sunday
    weekendEnd.setHours(23, 59, 59, 999);
    return weekendEnd;
  }
  
  private parseAIResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.response) {
          throw new Error('Missing response field');
        }
        
        // Ensure arrays exist
        parsed.recommendations = parsed.recommendations || [];
        parsed.suggestions = parsed.suggestions || [];
        parsed.nextQuestions = parsed.nextQuestions || [];
        parsed.data = parsed.data || {};
        
        return parsed;
      }
      
      // If no JSON found, wrap the response
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
  
  async generatePersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const context = await this.getUserContext(userId);
    const events = await this.getRelevantEvents({ context });
    
    // Filter events based on user interests and history
    const scoredEvents = events.map(event => {
      let score = 0.5; // Base score
      
      // Boost score if event matches user interests
      if (context.user.interests.length > 0) {
        const interestMatch = context.user.interests.some(interest => 
          event.tags?.includes(interest.toLowerCase()) ||
          event.category?.toLowerCase().includes(interest.toLowerCase()) ||
          event.subcategory?.toLowerCase().includes(interest.toLowerCase())
        );
        if (interestMatch) score += 0.3;
      }
      
      // Boost score for upcoming events (next 7 days)
      const daysUntilEvent = Math.ceil((event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent <= 7) score += 0.2;
      
      // Boost score for highly rated events
      if (event.ratingAverage && event.ratingAverage >= 4) {
        score += (event.ratingAverage - 4) / 2;
      }
      
      // Boost score for popular events
      if (event.wishlistCount > 10) {
        score += Math.min(event.wishlistCount / 100, 0.1);
      }
      
      return { ...event, score };
    });
    
    // Sort by score and return top recommendations
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(event => ({
        eventId: event.migoId || event.id,
        title: event.title,
        category: event.category,
        date: event.startDate,
        venue: event.venueName,
        price: event.isFree ? 'Free' : `${event.priceFrom} - ${event.priceTo} ${event.currency}`,
        score: event.score,
        reason: this.generateRecommendationReason(event, context),
      }));
  }
  
  private generateRecommendationReason(event: any, context: EventContext): string {
    const reasons = [];
    
    // Match with interests
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
    
    // Timing-based reasons
    const daysUntilEvent = Math.ceil((event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilEvent <= 3) {
      reasons.push('Happening very soon');
    } else if (daysUntilEvent <= 7) {
      reasons.push('Happening this week');
    } else if (this.isWeekendEvent(event.startDate)) {
      reasons.push('Perfect for the weekend');
    }
    
    // Popularity-based reasons
    if (event.ratingAverage && event.ratingAverage >= 4) {
      reasons.push(`Highly rated (${event.ratingAverage}/5)`);
    }
    if (event.wishlistCount > 20) {
      reasons.push('Very popular among users');
    }
    
    // Location-based reasons
    if (event.city === context.user.location.city) {
      reasons.push('In your city');
    }
    
    // Price-based reasons
    if (event.isFree) {
      reasons.push('Free entry');
    } else if (event.priceFrom && event.priceFrom <= 50) {
      reasons.push('Affordable price');
    }
    
    // Fallback reason
    if (reasons.length === 0) {
      reasons.push('Great event based on your activity');
    }
    
    return reasons.join(', ');
  }
  
  private isWeekendEvent(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
  }
  
  async processNaturalLanguageSearch(query: string, userId?: string): Promise<{
    events: any[];
    filters: any;
    suggestions: string[];
  }> {
    let context: EventContext | null = null;
    
    if (userId) {
      try {
        context = await this.getUserContext(userId);
      } catch (error) {
        // Use default context if user not found
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
    } else {
      context = {
        user: {
          id: 'guest',
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
    
    // Parse the natural language query
    const parsedQuery = await this.parseSearchQuery(query, context);
    
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
  
  private async parseSearchQuery(query: string, context: EventContext): Promise<any> {
    const prompt = `
    Parse this natural language event search query: "${query}"
    
    User Context:
    - Location: ${context.user.location.city}, ${context.user.location.country}
    - Current Date: ${context.currentDateTime.toISOString()}
    
    Extract the following information as JSON:
    1. Categories (array of event categories)
    2. Date range (start and end dates)
    3. Price range (min and max)
    4. Location (city, radius in km)
    5. Keywords (array of search terms)
    6. Special requirements (pet-friendly, wheelchair accessible, etc.)
    
    Today's date: ${new Date().toISOString().split('T')[0]}
    Weekend dates: ${this.getWeekendStart().toISOString().split('T')[0]} to ${this.getWeekendEnd().toISOString().split('T')[0]}
    
    Return ONLY valid JSON with this structure:
    {
      "categories": [],
      "dateRange": {},
      "priceRange": {},
      "location": {},
      "keywords": [],
      "requirements": []
    }
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Apply default location if not specified
        if (!parsed.location || !parsed.location.city) {
          parsed.location = {
            city: context.user.location.city,
            radius: 50,
          };
        }
        
        return parsed;
      }
      
      return {
        categories: [],
        dateRange: {},
        priceRange: {},
        location: { city: context.user.location.city, radius: 50 },
        keywords: query.toLowerCase().split(' ').filter(word => word.length > 2),
        requirements: [],
      };
      
    } catch (error) {
      console.error('Failed to parse search query:', error);
      return {
        categories: [],
        dateRange: {},
        priceRange: {},
        location: { city: context.user.location.city, radius: 50 },
        keywords: query.toLowerCase().split(' ').filter(word => word.length > 2),
        requirements: [],
      };
    }
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
    
    // Add general suggestions
    suggestions.push(
      'Save your favorite events to your wishlist',
      'Set up notifications for new events matching your interests',
      'Share events with friends to coordinate plans'
    );
    
    return suggestions;
  }
  
  async getChatHistory(userId: string, limit: number = 20): Promise<any[]> {
    const sessions = await prisma.chatSession.findMany({
      where: { 
        userId,
        isActive: true,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
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
      messages: session.messages.reverse(), // Return in chronological order
    }));
  }
  
  async clearChatHistory(userId: string): Promise<void> {
    await prisma.chatSession.updateMany({
      where: { userId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      }
    });
  }
}

export const migoAIAgent = new MigoAIAgent();