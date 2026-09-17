// src/routes/ai.routes.ts - COMPLETE FIXED VERSION
import { Router, Request, Response, NextFunction } from "express";
import { devAuthMiddleware } from "../middlewares/dev-auth.middleware";
import { migoAIAgent } from "../services/ai-agent.service";
import { z } from "zod";
import prisma from "../config/database";

const router = Router();

// Define custom request type with user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  sessionId: z.string().optional(),
});

const naturalSearchSchema = z.object({
  query: z.string().min(1).max(200),
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
      aiProvider: process.env.AI_PROVIDER || "ollama",
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

// ========== DEVELOPMENT TEST ROUTE ==========
router.post("/dev/setup", async (req: Request, res: Response) => {
  try {
    // Check if test user exists
    let testUser = await prisma.user.findUnique({
      where: { email: "test@migo.ai" }
    });
    
    if (!testUser) {
      // Create test user WITHOUT city/country fields
      testUser = await prisma.user.create({
        data: {
          id: "test_user_123",
          email: "test@migo.ai",
          name: "Test User",
          displayName: "Migo Tester",
          role: "USER",
          emailVerified: true,
          isVerified: true,
          interests: JSON.stringify(["music", "art", "technology"]),
        }
      });
      console.log("Test user created:", testUser.id);
    }
    
    res.json({
      success: true,
      data: {
        message: "Development setup complete",
        userId: testUser.id,
        devToken: "dev-test-token-123",
        instructions: "Use this token in headers: x-dev-token: dev-test-token-123",
        endpoints: {
          initializeChat: "POST /api/ai/chat/initialize",
          chat: "POST /api/ai/chat",
          getHistory: "GET /api/ai/chat/history"
        }
      }
    });
    
  } catch (error: any) {
    console.error("Dev setup error:", error);
    res.status(500).json({
      success: false,
      error: "Setup failed",
      message: error.message
    });
  }
});

// ========== PROTECTED ROUTES ==========

// Apply dev auth middleware to protected routes only
router.use(devAuthMiddleware);

// All routes below this line require authentication

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
    
    // Check if user exists in database; auto-create for dev/guest users
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Build a unique email — if the desired email already belongs to another user, use a random one
      const desiredEmail = req.user?.email;
      let resolvedEmail = desiredEmail || `guest_${Date.now()}@migo.ai`;
      if (desiredEmail) {
        const emailTaken = await prisma.user.findUnique({ where: { email: desiredEmail } });
        if (emailTaken) resolvedEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@migo.ai`;
      }
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: resolvedEmail,
            name: req.user?.name || 'Migo User',
            displayName: req.user?.name || 'Migo User',
            role: 'USER',
            emailVerified: false,
            isVerified: false,
          }
        });
      } catch (createErr: any) {
        // Last resort: find any existing user with this ID (race condition) or create with random email
        user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              id: userId,
              email: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}@migo.ai`,
              name: 'Migo User',
              displayName: 'Migo User',
              role: 'USER',
              emailVerified: false,
              isVerified: false,
            }
          });
        }
      }
    }

    // Initialize session
    const sessionId = await migoAIAgent.initializeSession(userId);

    // Get user context for personalized greeting
    const userContext = await migoAIAgent.getUserContext(userId).catch(() => null);

    const personalizedGreeting = userContext?.user?.name
      ? `Hello ${userContext.user.name.split(' ')[0]}! I'm MIGO AI, here to help you discover amazing events!`
      : `Hello! I'm MIGO AI, here to help you discover amazing events!`;

    // Get personalized recommendations (best-effort)
    const recommendations = await migoAIAgent.generatePersonalizedRecommendations(userId, 3).catch(() => []);
    
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

// Send message to AI (PROTECTED)
router.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Message is required and must be a non-empty string",
      });
    }
    
    // Process the chat message
    const response = await migoAIAgent.processChatMessage(userId, sessionId, message.trim());
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      error: "Chat failed",
      message: error.message || "An unexpected error occurred",
    });
  }
});

// Get chat history (PROTECTED)
router.get("/chat/history", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    const history = await migoAIAgent.getChatHistory(
      userId, 
      sessionId as string | undefined,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat history",
      message: error.message,
    });
  }
});

// Clear chat history (PROTECTED)
router.post("/chat/clear", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    await migoAIAgent.clearChatHistory(userId, sessionId);
    
    res.json({
      success: true,
      data: { message: "Chat history cleared successfully" },
    });
  } catch (error: any) {
    console.error("Clear chat history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear chat history",
      message: error.message,
    });
  }
});

// Get conversation starters (PROTECTED)
router.get("/chat/suggestions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    const suggestions = await migoAIAgent.getConversationStarters(userId);
    
    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get suggestions",
      message: error.message,
    });
  }
});

// Natural language search (PROTECTED)
router.post("/search/natural", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Search query is required",
      });
    }
    
    const searchResults = await migoAIAgent.processNaturalLanguageSearch(userId, query.trim());
    
    res.json({
      success: true,
      data: searchResults,
    });
  } catch (error: any) {
    console.error("Natural language search error:", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
      message: error.message,
    });
  }
});

// Get AI-powered event recommendations (PROTECTED)
router.post("/recommendations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { limit = 5 } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    
    const recommendations = await migoAIAgent.generatePersonalizedRecommendations(userId, limit);
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error("Recommendations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
});

export { router as aiRouter };