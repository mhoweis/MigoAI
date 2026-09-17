// src/api/auth/routes.ts
import { Router } from "express";
import { authController } from "./controller";
import { validate } from "../../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  phoneVerificationSchema,
  verifyPhoneSchema,
  refreshTokenSchema,
  changePasswordSchema,
  resetPasswordSchema,
  socialLoginSchema,
} from "@migo/shared";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// ========== PUBLIC ROUTES ==========

// Email/Password Auth
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

// Phone Auth
router.post(
  "/phone/send-verification",
  validate(phoneVerificationSchema),
  authController.sendPhoneVerification
);
router.post(
  "/phone/verify",
  validate(verifyPhoneSchema),
  authController.verifyPhoneCode
);

// Social Auth
router.post("/social", validate(socialLoginSchema), authController.socialLogin);

// Token Management
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshAccessToken
);

// Password Reset
router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Email Verification
router.post("/send-verification-email", authController.sendVerificationEmail);
router.get("/verify-email/:token", authController.verifyEmail);

// ========== PROTECTED ROUTES ==========
router.use(authMiddleware);

router.post("/logout", authController.logout);
router.post(
  "/change-password",
  validate(changePasswordSchema),
  authController.changePassword
);
router.post("/resend-verification", authController.resendVerification);

// Passkey Registration
router.post("/passkey/register/start", authController.startPasskeyRegistration);
router.post(
  "/passkey/register/finish",
  authController.finishPasskeyRegistration
);
router.post("/passkey/login/start", authController.startPasskeyLogin);
router.post("/passkey/login/finish", authController.finishPasskeyLogin);

export default router;
