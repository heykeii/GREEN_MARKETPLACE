import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const paymentReceiptSchema = new mongoose.Schema({
    // Order reference
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    
    // Customer who uploaded the receipt
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Seller who should receive the payment
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Original uploaded receipt image
    originalReceiptImage: {
        type: String,
        required: true // URL to stored image
    },
    
    // OCR extracted data
    extractedData: {
        referenceNumber: {
            type: String,
            required: true,
            unique: true // Prevent duplicate reference numbers
        },
        amount: {
            type: Number,
            required: true
        },
        sender: {
            name: String,
            number: String
        },
        receiver: {
            name: String,
            number: String
        },
        date: {
            type: Date,
            required: true
        },
        rawText: {
            type: String // Raw OCR text for debugging
        }
    },
    
    // Validation results
    validation: {
        amountMatch: {
            type: Boolean,
            required: true,
            default: false
        },
        receiverMatch: {
            type: Boolean,
            required: true,
            default: false
        },
        referenceValid: {
            type: Boolean,
            required: true,
            default: false
        },
        isDuplicate: {
            type: Boolean,
            required: true,
            default: false
        },
        overallStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        }
    },
    
    // Verification status and details
    verificationStatus: {
        type: String,
        enum: ['pending', 'processing', 'verified', 'rejected'],
        default: 'pending',
        index: true
    },
    
    rejectionReason: {
        type: String,
        trim: true
    },
    
    // Processing timestamps
    uploadedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    processedAt: {
        type: Date
    },
    
    verifiedAt: {
        type: Date
    },
    
    // Admin review (optional manual review)
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    reviewedAt: {
        type: Date
    },
    
    adminNotes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
paymentReceiptSchema.index({ order: 1, verificationStatus: 1 });
paymentReceiptSchema.index({ customer: 1, uploadedAt: -1 });
paymentReceiptSchema.index({ seller: 1, verificationStatus: 1 });

// Virtual for formatted amount
paymentReceiptSchema.virtual('formattedAmount').get(function() {
    return this.extractedData.amount ? `₱${this.extractedData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'N/A';
});

// Virtual for processing duration
paymentReceiptSchema.virtual('processingDuration').get(function() {
    if (!this.processedAt || !this.uploadedAt) return null;
    return Math.round((this.processedAt - this.uploadedAt) / 1000); // in seconds
});

// Pre-save middleware to update timestamps
paymentReceiptSchema.pre('save', function(next) {
    if (this.isModified('verificationStatus')) {
        if (this.verificationStatus === 'processing' && !this.processedAt) {
            this.processedAt = new Date();
        } else if (['verified', 'rejected'].includes(this.verificationStatus) && !this.verifiedAt) {
            this.verifiedAt = new Date();
        }
    }
    next();
});

// Static method to check for duplicate reference numbers
paymentReceiptSchema.statics.isDuplicateReference = async function(referenceNumber, excludeId = null) {
    const query = { 'extractedData.referenceNumber': referenceNumber };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const existing = await this.findOne(query);
    return !!existing;
};

// Instance method to validate receipt data
paymentReceiptSchema.methods.validateReceiptData = async function(orderData, sellerGcashDetails) {
    const validation = {
        amountMatch: false,
        receiverMatch: false,
        referenceValid: false,
        isDuplicate: false,
        overallStatus: 'rejected'
    };
    
    // Check amount match with robust parsing and rounding
    let extractedAmount = this.extractedData.amount;
    if (!(typeof extractedAmount === 'number' && Number.isFinite(extractedAmount))) {
        const parsed = parseFloat(String(extractedAmount)
            .replace(/[^\d.,-]/g, '')
            .replace(/,(?=\d{3}(\D|$))/g, '') // remove thousand separators
            .replace(/,(?=\d{1,2}$)/, '.')     // decimal comma -> dot
            .replace(/,/g, '')
        );
        extractedAmount = Number.isFinite(parsed) ? parsed : NaN;
    }
    const orderAmount = Number(orderData.totalAmount);
    const round2 = (n) => Number(Math.round((n + Number.EPSILON) * 100) / 100);
    const a = round2(extractedAmount ?? NaN);
    const b = round2(orderAmount);
    const amountDifference = Math.abs(a - b);
    const equalByFixed = Number.isFinite(a) && Number.isFinite(b) && a.toFixed(2) === b.toFixed(2);
    validation.amountMatch = (Number.isFinite(a) && Number.isFinite(b)) && (amountDifference <= 0.1 || equalByFixed || a === b);
    const amountDebug = {
        extractedRaw: this.extractedData.amount,
        extractedParsed: extractedAmount,
        orderAmountRaw: orderData.totalAmount,
        roundedExtracted: a,
        roundedOrder: b,
        amountDifference,
        equalByFixed,
        tolerance: 0.1,
        amountMatch: validation.amountMatch
    };
    if (!validation.amountMatch) {
        console.warn('GCash amount mismatch debug (model):', amountDebug);
    } else {
        console.log('GCash amount match debug (model):', amountDebug);
    }
    // Attach debug for higher-level controller responses if needed
    validation.amountDebug = amountDebug;
    
    // Check receiver match (fallback to sender number if receiver not detected)
    const extractedReceiverRaw = this.extractedData.receiver?.number || this.extractedData.sender?.number || '';
    const extractedReceiverNumber = extractedReceiverRaw.replace(/[^\d]/g, '');
    const sellerGcashNumber = sellerGcashDetails?.number?.replace(/[^\d]/g, '');
    validation.receiverMatch = extractedReceiverNumber === sellerGcashNumber;
    
    // Check reference number format
    // Normalize by removing any non-digits first, since receipts often contain spaces or hyphens
    const refNumberRaw = this.extractedData.referenceNumber ?? '';
    const refDigits = String(refNumberRaw).replace(/\D/g, '');
    // Accept 10 to 13 digits to cover historical and current GCash formats
    validation.referenceValid = refDigits.length >= 10 && refDigits.length <= 13;
    // Persist normalized digits for downstream checks and deduping
    if (validation.referenceValid) {
        this.extractedData.referenceNumber = refDigits;
    }
    
    // Check for duplicate reference number
    validation.isDuplicate = await this.constructor.isDuplicateReference(
        validation.referenceValid ? refDigits : refNumberRaw,
        this._id
    );
    
    // Overall status
    if (validation.amountMatch && validation.receiverMatch && validation.referenceValid && !validation.isDuplicate) {
        validation.overallStatus = 'verified';
    }
    
    this.validation = validation;
    return validation;
};

// Add pagination plugin
paymentReceiptSchema.plugin(mongoosePaginate);

const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);

export default PaymentReceipt;
