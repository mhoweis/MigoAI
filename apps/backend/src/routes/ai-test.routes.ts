// src/routes/ai-test.routes.ts - SIMPLE TEST VERSION
import { Router, Request, Response } from "express";
import { migoAIAgent } from "../services/ai-agent.service";
import { z } from "zod";

const router = Router();

// COMPLETELY PUBLIC ROUTE - NO AUTH AT ALL
router.get("/test/health", async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: "operational",
      timestamp: new Date().toISOString(),
      aiProvider: process.env.AI_PROVIDER || "ollama",
      model: process.env.AI_PROVIDER === "ollama" 
        ? process.env.OLLAMA_MODEL 
        : "gemini-1.5-pro",
    };
    
    res.json({
      success: true,
      data: healthStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "AI service unhealthy",
    });
  }
});

// PUBLIC DEV SETUP
router.post("/test/setup", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        message: "Test endpoint working!",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Setup failed",
    });
  }
});

// SIMPLE AI CHAT (NO AUTH)
router.post("/test/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }
    
    // Create a test session
    const testUserId = "test_user_" + Date.now();
    const sessionId = await migoAIAgent.initializeSession(testUserId);
    
    // Get AI response
    const aiResponse = await migoAIAgent.chat(sessionId, message);
    
    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        sessionId,
      }
    });
    
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      data: {
        response: "Test mode: I'm working but limited. " + error.message,
        sessionId: "test_session",
      }
    });
  }
});

export { router as aiTestRouter };