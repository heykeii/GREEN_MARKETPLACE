import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import sellerRoutes from "./routes/seller.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan("dev")); // HTTP request logger
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json()); // Parse JSON payloads

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);

// Test route
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to Green Marketplace API" });
});

// Error handling middleware - should be last
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


