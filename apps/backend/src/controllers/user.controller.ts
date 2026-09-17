// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/database';

export const updateInterests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array',
      });
    }

    // Update user interests
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          // Update or create preferences
          update: {
            interests: interests,
          },
          create: {
            interests: interests,
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Interests updated successfully',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interests',
      error: error.message,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        avatar,
      },
    });

    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};