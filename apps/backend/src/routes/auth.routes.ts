// src/routes/auth.routes.ts - SIMPLIFIED
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middlewares/auth.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification codes requested. Please try again later.' },
});
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

router.post('/phone-signup/send-otp', sendOtpLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    await authService.sendPhoneSignupOtp(phone, name);
    res.json({ success: true, data: { expiresIn: 600 } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/phone-signup/verify-otp', verifyOtpLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'Phone number and verification code are required' });
      return;
    }

    const result = await authService.verifyPhoneSignupOtp(phone, code, name);
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

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await authService.registerWithEmail(email, password, name);
    
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
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = identifier || email || phone;
    
    if (!loginIdentifier || !password) {
      res.status(400).json({ error: 'Email or phone number and password are required' });
      return;
    }
    
    const result = await authService.loginWithIdentifier(loginIdentifier, password);
    
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