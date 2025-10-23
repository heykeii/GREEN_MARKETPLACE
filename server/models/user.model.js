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
        default: null,
        validate: {
          validator: function(value) {
            return !value || /^https?:\/\/.+$/.test(value); // Only check if it's a URL
          },
          message: "Avatar must be a valid URL"
        }
    }
      ,
    bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        trim: true,
        default: ""
    },
    location: {
        address: {
            type: String,
            trim: true,
            default: ""
        },
        city: {
            type: String,
            trim: true,
            default: ""
        },
        province: {
            type: String,
            trim: true,
            default: ""
        },
        zipCode: {
            type: String,
            trim: true,
            default: "",
            validate: {
                validator: function (value) {
                    return !value || /^\d{4}$/.test(value); // allow blank, else 4 digits
                },
                message: "Zip code must be exactly 4 digits"
            }
        }
    },
    contactNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true; // allow blank
                return /^(?:\+639|09)\d{9}$/.test(value);
            },
            message: "Contact number must be a Philippine mobile (e.g., +639XXXXXXXXX or 09XXXXXXXXX)"
        },
        default: ""
    },
    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    socialLinks: [{
        platform: {
            type: String,
            trim: true,
            enum: ['website', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat', 'discord', 'telegram', 'other']
        },
        url: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function(value) {
                    // Basic URL check
                    if (!/^https?:\/\//i.test(value)) return false;
                    // Platform-domain consistency
                    try {
                        const urlObj = new URL(value);
                        const host = (urlObj.hostname || '').toLowerCase();
                        const platform = (this.platform || 'other').toLowerCase();
                        const allowedDomains = {
                            website: [],
                            other: [],
                            facebook: ['facebook.com', 'fb.com'],
                            instagram: ['instagram.com'],
                            twitter: ['twitter.com', 'x.com'],
                            linkedin: ['linkedin.com'],
                            youtube: ['youtube.com', 'youtu.be'],
                            tiktok: ['tiktok.com'],
                            pinterest: ['pinterest.com'],
                            snapchat: ['snapchat.com'],
                            discord: ['discord.com', 'discord.gg'],
                            telegram: ['t.me', 'telegram.me', 'telegram.org']
                        };
                        const domains = allowedDomains[platform] || [];
                        if (domains.length === 0) return true; // website/other -> any URL
                        return domains.some(d => host === d || host.endsWith('.' + d));
                    } catch (e) {
                        return false;
                    }
                },
                message: function(props) {
                    const p = (this.platform || 'other');
                    return `URL does not match selected platform (${p}).`;
                }
            }
        },
        displayName: {
            type: String,
            trim: true,
            default: ""
        }
    }],
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
        default: null,
        sparse: true
    },
    resetPasswordToken: {
        type: String,
        default: null,
        index: true
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false,
        required: true
    },
    isSeller: {
        type: Boolean,
        default: false
    },
    sellerStatus: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Gamification tracking
    purchaseCount: {
        type: Number,
        default: 0,
        min: 0
    },
    campaignsJoinedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Badge system
    badges: {
        shopper: {
            bronze: { type: Boolean, default: false },
            silver: { type: Boolean, default: false },
            gold: { type: Boolean, default: false }
        },
        campaigner: {
            bronze: { type: Boolean, default: false },
            silver: { type: Boolean, default: false },
            gold: { type: Boolean, default: false }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure badges field always has the expected object shape
function getDefaultBadges() {
    return {
        shopper: { bronze: false, silver: false, gold: false },
        campaigner: { bronze: false, silver: false, gold: false }
    };
}

userSchema.pre('save', function(next) {
    // Normalize badges field
    const b = this.badges;
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
        this.badges = getDefaultBadges();
    } else {
        if (!b.shopper || typeof b.shopper !== 'object' || Array.isArray(b.shopper)) {
            b.shopper = { bronze: false, silver: false, gold: false };
        } else {
            b.shopper.bronze = Boolean(b.shopper.bronze);
            b.shopper.silver = Boolean(b.shopper.silver);
            b.shopper.gold = Boolean(b.shopper.gold);
        }
        if (!b.campaigner || typeof b.campaigner !== 'object' || Array.isArray(b.campaigner)) {
            b.campaigner = { bronze: false, silver: false, gold: false };
        } else {
            b.campaigner.bronze = Boolean(b.campaigner.bronze);
            b.campaigner.silver = Boolean(b.campaigner.silver);
            b.campaigner.gold = Boolean(b.campaigner.gold);
        }
        this.badges = b;
    }

    // Normalize avatar field - ensure it's either a valid URL or null
    if (this.avatar && (this.avatar === 'null' || this.avatar.trim() === '')) {
        this.avatar = null;
    }

    next();
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

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
    const parts = [
        this.location.address,
        this.location.city,
        this.location.state,
        this.location.zipCode,
        this.location.country
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
    const fields = [
        this.firstName,
        this.lastName,
        this.email,
        this.avatar,
        this.bio,
        this.location.address,
        this.location.city,
        this.contactNumber
    ];
    
    const completedFields = fields.filter(field => field && field.toString().trim()).length;
    return Math.round((completedFields / fields.length) * 100);
});

const User = mongoose.model('User', userSchema);

export default User;