import express from "express";
import { register, login, verifyEmail, resendVerification, deactivateAccount } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Protected routes
router.post("/deactivate", protect, deactivateAccount);

export default router;
