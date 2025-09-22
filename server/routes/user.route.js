import express from "express";
import { register, login, verifyEmail, resendVerification, deactivateAccount, googleLogin, updateProfile, getUser, getProfile, searchSellers, followUser, unfollowUser, getFollowers, getFollowing, forgotPassword, resetPassword } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/google-login", googleLogin);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Public profile route
router.get("/profile/:userId", getProfile);

// Seller search route (protected for campaign creation)
router.get("/sellers", protect, searchSellers);

// Protected routes
router.get("/me", protect, getUser);
router.put("/update-profile", protect, upload.fields([{ name: 'avatar', maxCount: 1 }]), updateProfile);
router.post("/deactivate-account", protect, deactivateAccount);

// Social graph routes
router.post('/follow', protect, followUser);
router.post('/unfollow', protect, unfollowUser);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

export default router;
