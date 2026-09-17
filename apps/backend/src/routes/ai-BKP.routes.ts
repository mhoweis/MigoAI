// src/routes/ai.routes.ts - UPDATED WITH PUBLIC HEALTH ENDPOINT
import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { migoAIAgent } from "../services/ai-agent.service";
import { z } from "zod";

const router = Router();

// Define custom request type with user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    city?: string;
    country?: string;
    // Add other user properties you need
  };
}

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  sessionId: z.string().optional(),
});

// ========== PUBLIC ROUTES ==========

// Health check for AI service (PUBLIC)
router.get("/health", async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: "operational",
      timestamp: new Date().toISOString(),
      features: {
        chat: true,
        recommendations: true,
        search: true,
        personalization: true,
      },
      aiProvider: process.env.AI_PROVIDER || "gemini",
      model: process.env.AI_PROVIDER === "ollama" 
        ? process.env.OLLAMA_MODEL 
        : "gemini-1.5-pro",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    };
    
    res.json({
      success: true,
      data: healthStatus,
    });
  } catch (error: any) {
    console.error("AI health check failed:", error);
    res.status(500).json({
      success: false,
      error: "AI service unhealthy",
      message: "AI service is currently experiencing issues.",
    });
  }
});

// Get AI capabilities (PUBLIC)
router.get("/capabilities", async (req: Request, res: Response) => {
  const capabilities = [
    "Find events by category, date, or location",
    "Personalized recommendations based on your interests",
    "Event comparisons and planning assistance",
    "Budget planning for events",
    "Venue information and reviews",
    "Seasonal event recommendations",
    "Accessibility information",
    "Event combinations (e.g., dinner + show)",
    "Natural language search for events",
    "Personalized event suggestions",
  ];
  
  res.json({
    success: true,
    data: capabilities,
  });
});

// ========== PROTECTED ROUTES (Require Auth) ==========

// Apply auth middleware to all protected routes
router.use(authMiddleware);

// Initialize chat session
router.post("/chat/initialize", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    // Initialize session
    const sessionId = await migoAIAgent.initializeSession(userId);
    
    // Get user context for personalized greeting
    const userContext = await migoAIAgent.getUserContext(userId).catch(() => null);
    
    const personalizedGreeting = userContext?.user?.name 
      ? `Hello ${userContext.user.name.split(' ')[0]}! I'm MIGO AI, here to help you discover amazing events!`
      : `Hello! I'm MIGO AI, here to help you discover amazing events!`;
    
    // Get personalized recommendations
    const recommendations = await migoAIAgent.generatePersonalizedRecommendations(userId, 3);
    
    res.json({
      success: true,
      data: {
        sessionId,
        message: personalizedGreeting,
        recommendations: recommendations.map(rec => ({
          eventId: rec.eventId,
          title: rec.title,
          category: rec.category,
          date: rec.date,
          venue: rec.venue,
          price: rec.price,
          reason: rec.reason,
        })),
        suggestions: [
          "What events are happening this weekend?",
          "Suggest events based on my interests",
          "Find free events in my area",
          "What are popular events this month?",
        ],
        context: {
          interests: userContext?.user?.interests || [],
          location: userContext?.user?.location || { city: 'Unknown', country: 'Unknown' },
        },
      },
    });
  } catch (error: any) {
    console.error("Error initializing chat session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize chat session",
      message: "I'm having trouble setting up your chat session. Please try again.",
    });
  }
});

// Chat with AI
router.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = chatMessageSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validation.error.format(),
      });
    }
    
    const { message, sessionId } = validation.data;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    // Use provided sessionId or create a new one
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await migoAIAgent.initializeSession(userId);
    }
    
    console.log("Processing AI chat request:", {
      sessionId: currentSessionId,
      userId,
      message: message.substring(0, 100),
    });
    
    // Get AI response
    const aiResponse = await migoAIAgent.chat(currentSessionId, message);
    
    console.log("AI response generated:", {
      responseLength: aiResponse.response.length,
      recommendations: aiResponse.recommendations.length,
      suggestions: aiResponse.suggestions.length,
    });
    
    // Get relevant events for suggestions
    const suggestedEvents: Array<{
      id: string;
      title: string;
      category: string;
      description: string;
      startDate: string;
      venue: string;
      city: string;
      priceRange: string;
    }> = [];
    
    if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
      // Convert recommendations to suggested events format
      aiResponse.recommendations.forEach(rec => {
        suggestedEvents.push({
          id: rec.eventId,
          title: rec.eventId.includes('temp') ? 'Sample Event' : `Event ${rec.eventId.substring(0, 8)}`,
          category: 'Recommended',
          description: rec.reason,
          startDate: new Date().toISOString(),
          venue: 'Various venues',
          city: req.user?.city || 'Your city',
          priceRange: rec.confidence > 0.8 ? '$$' : '$',
        });
      });
    }
    
    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        response: aiResponse.response,
        recommendations: aiResponse.recommendations,
        suggestions: aiResponse.suggestions,
        nextQuestions: aiResponse.nextQuestions || [],
        suggestedEvents: suggestedEvents.length > 0 ? suggestedEvents : undefined,
        metadata: aiResponse.data || {},
      },
    });
    
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    
    // Fallback response
    const fallbackResponse = {
      success: true,
      data: {
        response: "I'm currently experiencing some technical difficulties. While I work on fixing this, you can:\n\n1. Try asking again in a moment\n2. Use the search feature to find events manually\n3. Check out our featured events\n\nI apologize for the inconvenience!",
        recommendations: [],
        suggestions: [
          "Browse events by category",
          "Check today's featured events",
          "Use the search bar to find specific events",
        ],
        nextQuestions: [
          "What type of events are you looking for?",
          "When do you want to attend an event?",
          "What's your budget range?",
        ],
      },
    };
    
    res.json(fallbackResponse);
  }
});

// Get chat history
router.get("/chat/history", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    const history = await migoAIAgent.getChatHistory(userId);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Error getting chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat history",
      message: "Unable to retrieve your chat history at this time.",
    });
  }
});

// Clear chat history
router.post("/chat/clear", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    await migoAIAgent.clearChatHistory(userId);
    
    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error: any) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear chat history",
      message: "Unable to clear your chat history at this time.",
    });
  }
});

// Get quick suggestions
router.get("/chat/suggestions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      // Return generic suggestions for non-authenticated users
      return res.json({
        success: true,
        data: [
          "What events are happening this weekend?",
          "Suggest concerts near me",
          "Find free events in my area",
          "What are the best festivals this month?",
          "Help me plan a date night",
        ],
      });
    }
    
    // Get user context for personalized suggestions
    try {
      const userContext = await migoAIAgent.getUserContext(userId);
      
      const suggestions = [
        "What events are happening this weekend?",
        "Suggest events based on my interests",
        "Find free events in my area",
        "What are popular events this month?",
      ];
      
      // Personalize suggestions based on user context
      if (userContext.user.interests && userContext.user.interests.length > 0) {
        suggestions.push(`Find ${userContext.user.interests[0]} events near me`);
      }
      
      if (userContext.user.location?.city) {
        suggestions.push(`What's happening in ${userContext.user.location.city}?`);
      }
      
      res.json({
        success: true,
        data: suggestions,
      });
    } catch (contextError) {
      // Fallback to generic suggestions
      console.warn("Could not get user context, using generic suggestions:", contextError);
      res.json({
        success: true,
        data: [
          "What events are happening this weekend?",
          "Suggest concerts near me",
          "Find free events in my area",
          "What are the best festivals this month?",
          "Help me plan a date night",
        ],
      });
    }
  } catch (error: any) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get suggestions",
      message: "Unable to generate suggestions at this time.",
    });
  }
});

// Natural language search
router.post("/search/natural", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.user?.id;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid query",
        message: "Please provide a search query",
      });
    }
    
    const searchResult = await migoAIAgent.processNaturalLanguageSearch(query, userId);
    
    res.json({
      success: true,
      data: searchResult,
    });
  } catch (error: any) {
    console.error("Error processing natural language search:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
      message: "Unable to process your search query at this time.",
    });
  }
});

export { router as aiRouter };