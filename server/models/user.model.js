import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
        default: ""
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password is required only if not using Google auth
        },
        minlength: [6, "Password must be at least 6 characters long"]
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    googleEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    avatar: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: {
        type: Date,
        default: null
    },
    verificationToken: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
});

// Virtual for user's full name setter
userSchema.virtual('fullName').set(function(name) {
    const parts = name.split(' ');
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ') || "";
});

const User = mongoose.model('User', userSchema);

export default User;