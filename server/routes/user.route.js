import express from "express";
import { register, login, verifyEmail, resendVerification, deactivateAccount, googleLogin, updateProfile, getUser, getProfile } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Public profile route
router.get("/profile/:userId", getProfile);

// Protected routes
router.get("/me", protect, getUser);
router.put("/update-profile", protect, upload.fields([{ name: 'avatar', maxCount: 1 }]), updateProfile);
router.post("/deactivate-account", protect, deactivateAccount);

export default router;
