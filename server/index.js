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

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev")); // HTTP request logger
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json()); // Parse JSON payloads

// Test route
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to Green Marketplace API" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


