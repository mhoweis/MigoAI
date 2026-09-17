// src/api/users/routes.ts - UPDATED
import { Router } from "express";
import { usersController } from "./controller";
import { validate } from "../../middlewares/validation.middleware";
import {
  updateProfileSchema,
  updateLocationSchema,
  updatePreferencesSchema,
  updateProfilePictureSchema,
} from "@migo/shared";
import { authenticate } from "../../middlewares/auth.middleware"; // Need to import authenticate

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get("/profile", usersController.getProfile);

// Update profile
router.put(
  "/profile",
  validate(updateProfileSchema),
  usersController.updateProfile
);

// Update location
router.put(
  "/location",
  validate(updateLocationSchema),
  usersController.updateLocation
);

// Update preferences
router.put(
  "/preferences",
  validate(updatePreferencesSchema),
  usersController.updatePreferences
);

// Update profile picture
router.put(
  "/profile/picture",
  validate(updateProfilePictureSchema),
  usersController.updateProfilePicture
);

// Upload profile picture (file upload - needs multer middleware)
router.post("/profile/upload-picture", usersController.uploadProfilePicture);

// Get user's bookings
router.get("/bookings", usersController.getUserBookings);

// Get user's wishlist
router.get("/wishlist", usersController.getWishlist);

// Get user's notifications
router.get("/notifications", usersController.getNotifications);

// Delete account
router.delete("/account", usersController.deleteAccount);

// Public routes (no authentication required for these)
router.get("/:userId", usersController.getUserById);
router.get("/:userId/events", usersController.getUserEvents);

// Following routes (require authentication)
router.post("/:userId/follow", authenticate, usersController.followUser);
router.delete("/:userId/follow", authenticate, usersController.unfollowUser);

export default router;