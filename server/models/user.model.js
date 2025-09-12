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
            default: ""
        }
    },
    contactNumber: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
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
                    return value.match(/^https?:\/\/.+/);
                },
                message: "Social link must be a valid URL"
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