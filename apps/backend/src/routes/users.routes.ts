// src/routes/users.routes.ts
import { Router, Request, Response } from "express";
import prisma from "../database/prisma";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// ✅ Add this middleware to protect routes
router.use(authenticate);

// Get all users (protected)
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        bookings: true,
        reviews: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by ID (protected)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: true,
        reviews: true,
        wishlists: {
          include: {
            event: true,
          },
        },
        organizedEvents: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ✅ Add this route for updating user interests
router.put("/interests", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { interests } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({ error: "Interests must be an array" });
    }

    // Update user preferences with interests
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...(req.body.preferences || {}),
          interests: interests,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: "Interests updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update interests error:", error);
    res.status(500).json({ error: "Failed to update interests" });
  }
});

// ✅ Add this route for getting current user
router.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user (protected)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, avatar, preferences } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        avatar,
        preferences,
      },
    });

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (protected)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export { router as usersRouter };
