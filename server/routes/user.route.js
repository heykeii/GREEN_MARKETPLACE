import express from "express";
import { register, login, deactivateAccount } from "../controllers/user.controller.js";
import { authenticate, loginLimiter } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", loginLimiter, login);


// Protected routes
router.delete("/deactivate", authenticate, deactivateAccount);

export default router;
