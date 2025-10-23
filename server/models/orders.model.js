import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // Customer
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Products
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        // Snapshot of selected variant at order time (optional)
        variant: {
            name: { type: String, trim: true },
            sku: { type: String, trim: true },
            attributes: { type: Map, of: String },
            price: { type: Number, min: 0 }
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    
    // Payment
    paymentMethod: {
        type: String,
        enum: ['cod', 'gcash'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },

    // Admin commission tracking
    commission: {
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number, default: 0 },
        receipt: { type: String }, // Receipt image URL
        receiptStatus: { 
            type: String, 
            enum: ['not_uploaded', 'uploaded', 'verified', 'rejected'],
            default: 'not_uploaded'
        },
        receiptUploadedAt: { type: Date },
        receiptRejectionReason: { type: String }
    },
    
    // GCash receipt tracking
    gcashReceiptStatus: {
        type: String,
        enum: ['not_required', 'required', 'uploaded', 'verified', 'rejected'],
        default: function() {
            return this.paymentMethod === 'gcash' ? 'required' : 'not_required';
        }
    },
    
    // Pricing
    subtotal: {
        type: Number,
        required: true
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingDetails: {
        estimatedDays: { type: Number },
        courierType: { type: String },
        distance: { type: String },
        explanation: { type: String }
    },
    totalAmount: {
        type: Number,
        required: true
    },
    
    // Order Number
    orderNumber: {
        type: String,
        unique: true
    },
    
    // Order Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Cancellation details (when status becomes cancelled)
    cancellation: {
        reason: { type: String, trim: true, maxlength: 300 },
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cancelledAt: { type: Date }
    },
    
    // Shipping Address
    shippingAddress: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        province: {
            type: String,
            required: true,
            trim: true
        },
        zipCode: {
            type: String,
            required: true,
            trim: true
        }
    },

    // Notes
    notes: {
        type: String,
        maxlength: 500
    },

    // Review tracking - which items have been reviewed
    reviewedItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        reviewedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `GM${Date.now()}${count + 1}`;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
