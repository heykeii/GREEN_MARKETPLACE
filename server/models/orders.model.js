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
    
    // Pricing
    subtotal: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    
    // Order Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // Notes
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `GM${Date.now()}${count + 1}`;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
