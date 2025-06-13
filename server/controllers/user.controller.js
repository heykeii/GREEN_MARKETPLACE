import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from 'resend';
import crypto from 'crypto';

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email function
const sendVerificationEmail = async (email, firstName, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    console.log('Attempting to send verification email...');
    console.log('To:', email);
    console.log('Verification URL:', verificationUrl);
    
    try {
        const data = await resend.emails.send({
            from: 'Green Marketplace <noreply@greenmarketcom.shop>',
            to: email,
            subject: 'Verify your email address',
            html: `
                <h1>Welcome to Green Marketplace!</h1>
                <p>Hi ${firstName},</p>
                <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; border-radius: 4px;">Verify Email</a>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
            `
        });
        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Detailed email sending error:', {
            error: error.message,
            code: error.statusCode,
            details: error.details,
            stack: error.stack
        });
        throw error;
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
            isVerified: false
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, firstName, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Delete the user if email sending fails
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ 
                message: "Failed to send verification email. Please try registering again.",
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

        res.status(201).json({
            message: "Registration successful! Please check your email to verify your account.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation Error", 
                errors: Object.keys(error.errors).reduce((acc, key) => {
                    acc[key] = error.errors[key].message;
                    return acc;
                }, {})
            });
        }
        res.status(500).json({ 
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        console.log('Email verification successful:', {
            userId: user._id,
            email: user.email,
            isVerified: user.isVerified
        });

        // Send success response
        res.status(200).json({ 
            message: "Email verified successfully! You can now log in.",
            isVerified: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ 
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
                isVerificationRequired: true 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || "1h",
                algorithm: 'HS256'
            }
        );

        // Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000 // 1 hour
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            token
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
                message: "If your email exists in our system, you will receive a verification link shortly." 
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
                message: "A new verification email has been sent. Please check your inbox." 
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            res.status(500).json({ 
                message: "Failed to send verification email. Please try again later.",
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find and update user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Soft delete - mark as inactive
        user.isActive = false;
        user.deactivatedAt = new Date();
        await user.save();

        // Clear authentication cookie
        res.clearCookie("token");

        res.status(200).json({ message: "Account deactivated successfully" });
    } catch (error) {
        console.error("Deactivation error:", error);
        res.status(500).json({ message: "Server error" });
    }
};