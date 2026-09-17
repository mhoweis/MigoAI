// src/api/ai/routes.ts
import { Router } from "express";
import { aiController } from "./controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate); // All AI routes require authentication

// AI chat endpoint
router.post("/chat", aiController.chat);

// Event recommendations
router.post("/recommendations", aiController.getRecommendations);

// Generate event descriptions
router.post("/generate-description", aiController.generateDescription);

// Sentiment analysis for reviews
router.post("/analyze-sentiment", aiController.analyzeSentiment);

// AI-powered search
router.post("/smart-search", aiController.smartSearch);

export default router;
