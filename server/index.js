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
import productRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import reviewRoutes from './routes/review.route.js'
import orderRoutes from './routes/order.route.js'
import reportRoutes from './routes/report.route.js'
import notificationRoutes from './routes/notification.route.js'
import chatRoutes from './routes/chat.route.js'
import campaignRoutes from './routes/campaign.route.js'
import announcementRoutes from './routes/announcement.route.js'
import paymentReceiptRoutes from './routes/paymentReceipt.route.js'
import feedbackRoutes from './routes/feedback.route.js'
import adminFeedbackRoutes from './routes/adminFeedback.route.js'
import sustainabilityContentRoutes from './routes/sustainabilityContent.route.js'
import certificationRoutes from './routes/certification.route.js'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { setIO } from './utils/socket.js'
import { verifyOpenAIConnection } from './utils/openai.js'

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan("dev")); // HTTP request logger
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression()); // Compress responses
app.use(express.json({ limit: '15mb' })); // Parse JSON bodies with larger limit for uploads
app.use(express.urlencoded({ extended: true, limit: '15mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json({ limit: '15mb' })); // Parse JSON payloads

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/payment-receipts", paymentReceiptRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/admin/feedback", adminFeedbackRoutes);
app.use("/api/v1/sustainability", sustainabilityContentRoutes);
app.use("/api/v1/admin/sustainability", sustainabilityContentRoutes);
app.use("/api/v1/certifications", certificationRoutes);

// Test route
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to Green Marketplace API" });
});

// Error handling middleware - should be last
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { _id: decoded.userId };
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // Join a user-specific room for targeted real-time updates
  if (socket?.user?._id) {
    try {
      socket.join(socket.user._id.toString());
    } catch (e) {
      // no-op if join fails
    }
  }

  // Join conversation room
  socket.on('join_conversation', ({ conversationId }) => {
    if (conversationId) socket.join(conversationId);
  });

  // Typing indicator relay
  socket.on('typing', ({ conversationId, isTyping }) => {
    if (conversationId) socket.to(conversationId).emit('typing', { userId: socket.user._id, isTyping });
  });
});

setIO(io);

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    // Verify OpenAI connectivity (logs success/failure)
    await verifyOpenAIConnection();
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


