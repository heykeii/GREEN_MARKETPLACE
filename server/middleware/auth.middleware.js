import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/user.model.js";

// Rate limiting middleware for login attempts
export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 attempts
    message: {
        message: "Too many login attempts. Please try again after 1 minute."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Authentication middleware
export const protect = async (req, res, next) => {
    try {
        let token = req.cookies.token;

        // Check Authorization header if token is not in cookies
        const authHeader = req.headers.authorization;
        if (!token && authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Fetch user from database to get role and other info
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                res.clearCookie("token");
                return res.status(401).json({ message: "Token expired. Please login again." });
            }
            throw error;
        }
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ message: "Authentication failed" });
    }
}; 