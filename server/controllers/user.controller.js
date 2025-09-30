import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../utils/cloudinary.js";
import { NotificationService } from "../utils/notificationService.js";
import { 
  ValidationError, 
  NotFoundError, 
  AuthenticationError,
  ConflictError,
  validateRequired,
  validateEmail 
} from "../utils/errorClasses.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Follow a user
export const followUser = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const { targetUserId } = req.body;
  
  // Validation
  validateRequired(['targetUserId'], req.body);
  
  if (targetUserId.toString() === followerId.toString()) {
    throw new ValidationError('You cannot follow yourself');
  }

  const [follower, target] = await Promise.all([
    User.findById(followerId),
    User.findById(targetUserId)
  ]);
  
  if (!target) {
    throw new NotFoundError('User not found');
  }

  // Add if not exists
  const updatedFollower = await User.findByIdAndUpdate(
    followerId,
    { $addToSet: { following: target._id } },
    { new: true }
  ).select('-password');
  
  await User.findByIdAndUpdate(target._id, { $addToSet: { followers: followerId } });

  try {
    // Notify the target user that someone followed them
    await NotificationService.notifyUserFollowed(target._id, follower);
  } catch (e) {
    // non-fatal notification error, continue
    console.warn('Failed to send follow notification:', e.message);
  }

  res.json({ success: true, user: updatedFollower });
});

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId is required' });
    }
    if (targetUserId.toString() === followerId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot unfollow yourself' });
    }

    const target = await User.findById(targetUserId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedFollower = await User.findByIdAndUpdate(
      followerId,
      { $pull: { following: target._id } },
      { new: true }
    ).select('-password');
    await User.findByIdAndUpdate(target._id, { $pull: { followers: followerId } });

    return res.json({ success: true, user: updatedFollower });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unfollow user', error: error.message });
  }
};

// Get followers list for a user
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('followers', 'firstName lastName avatar email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, followers: user.followers || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch followers', error: error.message });
  }
};

// Get following list for a user
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('following', 'firstName lastName avatar email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, following: user.following || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch following', error: error.message });
  }
};

// Set default environment variables if not provided

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send verification email function
const sendVerificationEmail = async (email, firstName, verificationToken) => {
  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/verify-email/${verificationToken}`;

  console.log("Attempting to send verification email...");
  console.log("To:", email);
  console.log("Verification URL:", verificationUrl);

  // If RESEND_API_KEY is not properly set, just log the verification URL
  if (
    !process.env.RESEND_API_KEY ||
    process.env.RESEND_API_KEY === "dummy-key"
  ) {
    console.log(
      "Email service not configured. Verification URL:",
      verificationUrl
    );
    return { success: true, data: { message: "Email service not configured" } };
  }

  try {
    const data = await resend.emails.send({
      from: "Green Marketplace <noreply@greenmarketcom.shop>",
      to: email,
      subject: "Verify your email address",
      html: `
                <h1>Welcome to Green Marketplace!</h1>
                <p>Hi ${firstName},</p>
                <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; border-radius: 4px;">Verify Email</a>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
            `,
    });
    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Detailed email sending error:", {
      error: error.message,
      code: error.statusCode,
      details: error.details,
      stack: error.stack,
    });
    throw error;
  }
};

// Verify Google token
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Google token verification error:", error);
    throw new Error("Invalid Google token");
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    console.log("Received Google login request with token:", token);

    if (!token) {
      console.error("Google token not provided in request body.");
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify Google token
    console.log("Verifying Google token...");
    const payload = await verifyGoogleToken(token);
    console.log("Google token verified. Payload:", payload);

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: avatar,
    } = payload;

    // Handle missing last name - use empty string as fallback
    const userLastName = lastName || "";

    // Check if user already exists
    console.log(
      `Searching for user with googleId: ${googleId} or email: ${email}`
    );
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    let isNewUser = false;
    if (user) {
      console.log("User found:", user._id);
      // Update user with Google info if they don't have it
      if (!user.googleId) {
        console.log("User exists, updating with Google ID.");
        user.googleId = googleId;
        user.googleEmail = email;
        user.avatar = avatar;
        // Do not auto-verify Google users - they still need email verification
        await user.save();
        console.log("User updated successfully.");
      }
    } else {
      // Create new user
      console.log("User not found, creating a new user.");
      const verificationToken = generateVerificationToken();
      user = await User.create({
        firstName,
        lastName: userLastName,
        email,
        googleId,
        googleEmail: email,
        avatar,
        isVerified: false, // Google users must still verify email
        verificationToken,
        password: crypto.randomBytes(32).toString("hex"), // Random password for Google users
      });
      isNewUser = true;
      console.log("New user created:", user._id);
    }

    // If user is not verified, send verification email and block login
    if (!user.isVerified) {
      // Generate a new token if not present
      if (!user.verificationToken) {
        user.verificationToken = generateVerificationToken();
        await user.save();
      }
      try {
        await sendVerificationEmail(user.email, user.firstName, user.verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email (Google login):", emailError);
        return res.status(500).json({
          message: "Failed to send verification email. Please try again.",
          error: process.env.NODE_ENV === "development" ? emailError.message : undefined,
        });
      }
      return res.status(403).json({
        message: "Please verify your email address. A verification link has been sent to your email.",
        isVerificationRequired: true,
        email: user.email,
        firstName: user.firstName,
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    console.log("Generating JWT token for user:", user._id);
    const jwtToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "48h",
        algorithm: "HS256",
      }
    );

    // Set cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 48 * 60 * 60 * 1000, // 48 hours
    });

    console.log("Google login process completed successfully.");
    res.status(200).json({
      message: "Google login successful",
      user: user.toObject(),
      token: jwtToken,
    });
  } catch (error) {
    console.error("--- Google Login Error ---");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("--------------------------");
    res.status(500).json({
      message: "Google login failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An internal server error occurred.",
    });
  }
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, firstName, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Delete the user if email sending fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message:
          "Failed to send verification email. Please try registering again.",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    // Automatically verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Log the verification for debugging
    console.log("Email verification successful:", {
      userId: user._id,
      email: user.email,
      isVerified: user.isVerified,
    });

    // Send success response
    res.status(200).json({
      message: "Email verified successfully! You can now log in.",
      isVerified: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before logging in",
        isVerificationRequired: true,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "48h",
        algorithm: "HS256",
      }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 48 * 60 * 60 * 1000, // 48 hours
    });

    res.status(200).json({
        message: "Login successful",
        user,
        token,
      });
      
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if the user exists
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a verification link shortly.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    await user.save();

    // Send new verification email
    try {
      await sendVerificationEmail(email, user.firstName, verificationToken);
      res.status(200).json({
        message:
          "A new verification email has been sent. Please check your inbox.",
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password - request reset link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Rate limit: max 5 requests per 30 minutes per email
    const now = Date.now();
    const windowMs = 30 * 60 * 1000;
    if (!global.__resetRate__) global.__resetRate__ = new Map();
    const key = email.toLowerCase();
    const entry = global.__resetRate__.get(key) || { count: 0, last: now };
    if (now - entry.last > windowMs) { entry.count = 0; entry.last = now; }
    entry.count += 1; global.__resetRate__.set(key, entry);
    if (entry.count > 5) {
      return res.status(200).json({ message: 'If your email exists, a reset link has been sent.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If your email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    // Reuse Resend to send email
    try {
      const html = `
        <table role="presentation" width="100%" style="background:#f6f9fc;padding:24px 0;font-family:Arial,sans-serif">
          <tr><td align="center">
            <table width="600" style="background:#fff;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.05);padding:28px;">
              <tr><td align="center" style="padding-bottom:16px;">
                <div style="display:inline-block;padding:10px 14px;border-radius:12px;background:#10b981;color:#fff;font-weight:700;">Green Marketplace</div>
              </td></tr>
              <tr><td>
                <h2 style="margin:0 0 12px;color:#111827;">Reset your password</h2>
                <p style="margin:0 0 16px;color:#374151;">We received a request to reset your password. Click the button below to continue.</p>
                <p style="text-align:center;margin:24px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset Password</a>
                </p>
                <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">If the button doesn’t work, copy and paste this link:</p>
                <p style="word-break:break-all;color:#2563eb;">${resetUrl}</p>
                <p style="margin-top:24px;color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn’t request this, ignore this email.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>`;
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key') {
        console.log('Password reset URL:', resetUrl);
      } else {
        await resend.emails.send({ from: 'Green Marketplace <noreply@greenmarketcom.shop>', to: email, subject: 'Reset your password', html });
      }
    } catch (e) {
      console.error('Failed to send reset email', e);
    }

    return res.status(200).json({ message: 'If your email exists, a reset link has been sent.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password - with token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ message: "Failed to deactivate account" });
  }
};

// Get current user information
export const getUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;
    res.status(200).json({ 
      user: {
        ...user.toObject(),
        followerCount,
        followingCount
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user information" });
  }
};

// Get public profile of a user (for admin/user to view seller profile)
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    // Only select public fields (do not select virtuals like fullName)
    const user = await User.findById(userId).select(
      'firstName lastName email avatar bio location contactNumber socialLinks isSeller sellerStatus role createdAt updatedAt followers following'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Optional auth: parse bearer token if present to compute isFollowing
    let authUserId = undefined;
    try {
      const header = req.headers?.authorization || '';
      if (header.startsWith('Bearer ')) {
        const token = header.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        authUserId = decoded?.userId?.toString();
      }
    } catch (e) {
      // ignore token errors for public profile
    }
    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;
    const isFollowing = authUserId ? (user.followers || []).map(String).includes(authUserId) : false;
    const profile = user.toObject();
    delete profile.password;
    res.status(200).json({ profile: { ...profile, followerCount, followingCount, isFollowing } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle avatar upload if present
    let avatarUrl = user.avatar;
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      const file = req.files.avatar[0];
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "avatars",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(file.buffer);
      });
      avatarUrl = result.secure_url;
    }

    // Update fields
    user.firstName = req.body.firstName ?? user.firstName;
    user.lastName = req.body.lastName ?? user.lastName;
    user.bio = req.body.bio ?? user.bio;
    user.contactNumber = req.body.contactNumber ?? user.contactNumber;
    user.avatar = avatarUrl;
    // Always set location fields, even if blank
    user.location = {
      address: req.body.location?.address ?? user.location?.address ?? "",
      city: req.body.location?.city ?? user.location?.city ?? "",
      province: req.body.location?.province ?? user.location?.province ?? "",
      zipCode: req.body.location?.zipCode ?? user.location?.zipCode ?? "",
    };

    // Social links
    // Parse social links JSON
    let socialLinks = [];
    if (req.body.socialLinks) {
      try {
        socialLinks = JSON.parse(req.body.socialLinks);
      } catch (e) {
        console.error("Invalid socialLinks JSON", e);
      }
    }
    user.socialLinks = Array.isArray(socialLinks) ? socialLinks : [];

    await user.save();
    res.status(200).json({ message: "Profile updated", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Search for verified sellers (for promotional campaigns)
export const searchSellers = async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }

    const filter = {
      isSeller: true,
      sellerStatus: 'verified',
      isActive: true,
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const sellers = await User.find(filter)
      .select('firstName lastName email businessName avatar')
      .limit(parseInt(limit))
      .sort({ businessName: 1, firstName: 1 });

    res.status(200).json({ 
      success: true, 
      sellers 
    });
  } catch (error) {
    console.error('Search sellers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search sellers' 
    });
  }
};