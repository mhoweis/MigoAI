// src/routes/auth.routes.ts - SIMPLIFIED
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await authService.registerWithEmail(email, password, name, phone);
    
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
        isFirstLogin: true,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await authService.loginWithEmail(email, password);
    
    // Check if user has interests
    const hasInterests = result.user.interests && Array.isArray(result.user.interests) && result.user.interests.length > 0;
    
    res.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
        isFirstLogin: !hasInterests,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    // Get user from database
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Remove password from response
    const { password, ...safeUser } = user;
    
    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update interests
router.put('/interests', authenticate, async (req: any, res: Response) => {
  try {
    const { interests } = req.body;
    
    if (!interests || !Array.isArray(interests) || interests.length < 3) {
      res.status(400).json({ error: 'At least 3 interests are required' });
      return;
    }
    
    const prisma = req.app.get('prisma');
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        interests: interests as any,
        updatedAt: new Date(),
      },
    });
    
    // Remove password
    const { password, ...safeUser } = user;
    
    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post('/logout', authenticate, async (req: any, res: Response) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.userId, refreshToken);
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as authRouter };