import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    // Reporter (who made the report)
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // What/Who is being reported
    reportedItem: {
        type: {
            type: String,
            enum: ['product', 'user', 'order', 'review'],
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    
    // Report Details
    reason: {
        type: String,
        enum: [
            'inappropriate_content',
            'fake_product',
            'poor_quality',
            'wrong_item',
            'scam',
            'harassment',
            'spam',
            'copyright_violation',
            'other'
        ],
        required: true
    },
    
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    // Evidence/Proof
    evidence: [{
        type: String, // URLs to images, screenshots, etc.
        trim: true
    }],
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'dismissed'],
        default: 'pending'
    },
    
    // Admin Response
    adminResponse: {
        type: String,
        maxlength: 1000
    },
    
    // Resolution
    resolution: {
        action: {
            type: String,
            enum: [
                'warning_issued',
                'item_removed',
                'user_suspended',
                'user_banned',
                'refund_issued',
                'no_action',
                'other'
            ]
        },
        notes: {
            type: String,
            maxlength: 500
        }
    }
}, {
    timestamps: true
});

// Generate report number
reportSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await mongoose.model('Report').countDocuments();
        this.reportNumber = `RP${Date.now()}${count + 1}`;
    }
    next();
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
