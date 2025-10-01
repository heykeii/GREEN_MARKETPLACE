import mongoose from "mongoose";

const carbonFootprintSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    
    // Input data from seller
    materials: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        }
    }],
    
    weight: {
        type: Number,
        required: true,
        min: 0.001, // Minimum 1 gram
        default: 1 // Default 1 kg
    },
    
    productionMethod: {
        type: String,
        enum: ['handmade', 'machine-made', 'upcycled', 'recycled', 'organic', 'conventional', 'artisan', 'industrial'],
        required: true
    },
    
    // AI-generated carbon footprint data
    carbonFootprintKg: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Comparison data
    baselineFootprintKg: {
        type: Number,
        required: true,
        min: 0
    },
    
    co2SavingsKg: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Environmental impact metrics
    equivalentTrees: {
        type: Number,
        required: true,
        min: 0
    },
    
    equivalentMiles: {
        type: Number,
        required: true,
        min: 0
    },
    
    // AI processing metadata
    aiModel: {
        type: String,
        default: 'gpt-4'
    },
    
    aiPrompt: {
        type: String,
        required: true
    },
    
    aiResponse: {
        type: String,
        required: true
    },
    
    calculationDate: {
        type: Date,
        default: Date.now
    },
    
    // Verification status
    verified: {
        type: Boolean,
        default: false
    },
    
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    verifiedAt: {
        type: Date
    },
    
    // Admin notes
    adminNotes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for efficient queries
carbonFootprintSchema.index({ product: 1 });
carbonFootprintSchema.index({ carbonFootprintKg: 1 });
carbonFootprintSchema.index({ verified: 1 });

// Virtual for environmental impact description
carbonFootprintSchema.virtual('impactDescription').get(function() {
    const trees = this.equivalentTrees;
    const miles = this.equivalentMiles;
    
    let description = `This product has a carbon footprint of ${this.carbonFootprintKg} kg CO₂`;
    
    if (trees > 0) {
        description += `, equivalent to ${trees.toFixed(1)} tree${trees !== 1 ? 's' : ''} planted`;
    }
    
    if (miles > 0) {
        description += ` or ${miles.toFixed(1)} miles driven`;
    }
    
    return description;
});

// Virtual for savings description
carbonFootprintSchema.virtual('savingsDescription').get(function() {
    if (this.co2SavingsKg <= 0) return null;
    
    return `You save ${this.co2SavingsKg.toFixed(1)} kg CO₂ compared to conventional alternatives`;
});

const CarbonFootprint = mongoose.model('CarbonFootprint', carbonFootprintSchema);

export default CarbonFootprint;
