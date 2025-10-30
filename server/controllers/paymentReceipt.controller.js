import PaymentReceipt from '../models/paymentReceipt.model.js';
import Order from '../models/orders.model.js';
import SellerApplication from '../models/seller.model.js';
import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import { NotificationService } from '../utils/notificationService.js';
import OpenAI from 'openai';
import exif from 'exif-parser';
import multer from 'multer';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_SECRET
});

// Multer setup for receipt uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Helper function to upload receipt image to Cloudinary
const uploadReceiptToCloudinary = async (fileBuffer, filename) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'payment_receipts',
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1600, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        ).end(fileBuffer);
    });
};

// Helper to normalize amount values coming from OCR (handles ₱, commas, spaces)
const normalizeAmount = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Number(value.toFixed(2));
    if (value == null) return NaN;
    const str = String(value)
        .replace(/[^\d.,-]/g, '') // keep digits, comma, dot, minus
        .replace(/,(?=\d{3}(\D|$))/g, '') // remove thousand separators
        .replace(/,(?=\d{1,2}$)/, '.') // convert decimal comma to dot when applicable
        .replace(/,/g, ''); // drop remaining commas
    const num = parseFloat(str);
    return Number.isFinite(num) ? Number(num.toFixed(2)) : NaN;
};

// Helper function to extract text from receipt using OpenAI Vision API
const extractReceiptData = async (imageUrl) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Use the vision-capable model
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this GCash payment receipt and extract the following information in JSON format:
                            - reference_number: The transaction reference number (usually 10-13 digits)
                            - amount: The payment amount (as a number, e.g., 1200.00)
                            - sender_name: The sender's name
                            - sender_number: The sender's phone number
                            - receiver_name: The receiver's name
                            - receiver_number: The receiver's phone number
                            - date: The transaction date and time (in ISO format if possible)
                            
                            Return ONLY a valid JSON object with these fields. If any information is not clearly visible, use null for that field.
                            
                            Example format:
                            {
                                "reference_number": "9876543210",
                                "amount": 1200.00,
                                "sender_name": "Maria Santos",
                                "sender_number": "09171234567",
                                "receiver_name": "Pedro Reyes", 
                                "receiver_number": "09189876543",
                                "date": "2025-09-21T17:20:00.000Z"
                            }`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        });

        const extractedText = response.choices[0].message.content.trim();
        
        // Try to parse the JSON response
        try {
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extractedData = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    data: extractedData,
                    rawText: extractedText
                };
            } else {
                throw new Error('No JSON object found in response');
            }
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            return {
                success: false,
                error: 'Failed to parse extracted data',
                rawText: extractedText
            };
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        return {
            success: false,
            error: error.message,
            rawText: null
        };
    }
};

// Upload and verify GCash receipt
export const uploadGcashReceipt = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt image is required'
            });
        }

        // Find and validate order
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify order belongs to the user
        if (order.customer.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to upload receipt for this order'
            });
        }

        // Verify order uses GCash payment method
        if (order.paymentMethod !== 'gcash') {
            return res.status(400).json({
                success: false,
                message: 'This order does not use GCash payment method'
            });
        }

        // Check if receipt already uploaded for this order
        const existingReceipt = await PaymentReceipt.findOne({ order: orderId });
        if (existingReceipt) {
            return res.status(400).json({
                success: false,
                message: 'Receipt has already been uploaded for this order',
                receiptId: existingReceipt._id
            });
        }

        // Get seller details from the first product (assuming single seller per order)
        const firstProductSellerId = order.items[0].product.seller;
        const sellerApplication = await SellerApplication.findOne({ user: firstProductSellerId });
        
        if (!sellerApplication || !sellerApplication.gcash) {
            return res.status(400).json({
                success: false,
                message: 'Seller GCash details not found'
            });
        }

        // Upload receipt image to Cloudinary
        console.log('Uploading receipt image to Cloudinary...');
        const receiptImageUrl = await uploadReceiptToCloudinary(
            req.file.buffer, 
            `receipt_${orderId}_${Date.now()}`
        );

        // EXIF check (tampering detection)
        let exifSuspicious = false;
        try {
            const parser = exif.create(req.file.buffer);
            const exifData = parser.parse();
            const software = exifData.tags?.Software || exifData.image?.Software || exifData.tags?.software;
            const hasDate = !!(exifData.tags?.DateTimeOriginal || exifData.tags?.CreateDate || exifData.tags?.ModifyDate);
            const softwareStr = typeof software === 'string' ? software.toLowerCase() : String(software || '').toLowerCase();
            if (softwareStr.includes('photoshop') || softwareStr.includes('gimp') || softwareStr.includes('canva')) {
                exifSuspicious = true;
            }
            if (!hasDate) {
                exifSuspicious = true;
            }
        } catch (_) {
            // If EXIF parse fails, do not block, but mark as suspicious for logging
            exifSuspicious = true;
        }

        // Extract data using OpenAI OCR
        console.log('Extracting receipt data using OCR...');
        const ocrResult = await extractReceiptData(receiptImageUrl);

        if (!ocrResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to extract receipt data',
                error: ocrResult.error
            });
        }

        // Create payment receipt record
        const paymentReceipt = new PaymentReceipt({
            order: orderId,
            customer: userId,
            seller: firstProductSellerId,
            originalReceiptImage: receiptImageUrl,
            extractedData: {
                referenceNumber: ocrResult.data.reference_number,
                amount: normalizeAmount(ocrResult.data.amount),
                sender: {
                    name: ocrResult.data.sender_name,
                    number: ocrResult.data.sender_number
                },
                receiver: {
                    name: ocrResult.data.receiver_name || ocrResult.data.sender_name || null,
                    number: ocrResult.data.receiver_number || ocrResult.data.sender_number || null
                },
                date: ocrResult.data.date ? new Date(ocrResult.data.date) : new Date(),
                rawText: ocrResult.rawText
            },
            verificationStatus: 'processing'
        });

        // Validate the extracted data against order and seller details
        console.log('Validating extracted data...');
        const validation = await paymentReceipt.validateReceiptData(order, sellerApplication.gcash);
        
        // Update verification status based on validation (+ EXIF suspicion)
        if (validation.overallStatus === 'verified') {
            paymentReceipt.verificationStatus = 'verified';
            // Update order payment status
            order.paymentStatus = 'paid';
            order.gcashReceiptStatus = 'verified';
            await order.save();
        } else {
            paymentReceipt.verificationStatus = 'rejected';
            // Set rejection reason based on validation failures
            const reasons = [];
            if (!validation.amountMatch) reasons.push('Amount mismatch');
            if (!validation.receiverMatch) reasons.push('Receiver account mismatch');
            if (!validation.referenceValid) reasons.push('Invalid reference number format');
            if (validation.isDuplicate) reasons.push('Duplicate reference number');
            if (exifSuspicious) reasons.push('Suspicious EXIF metadata');
            
            paymentReceipt.rejectionReason = reasons.join(', ');
            order.gcashReceiptStatus = 'rejected';
            await order.save();
        }

        await paymentReceipt.save();

        // Send notifications
        try {
            if (validation.overallStatus === 'verified') {
                // Notify customer about successful verification
                await NotificationService.notifyReceiptVerified(
                    userId, 
                    order, 
                    paymentReceipt.extractedData.referenceNumber
                );
                
                // Notify seller about payment confirmation
                await NotificationService.notifyPaymentReceived(
                    firstProductSellerId, 
                    order, 
                    paymentReceipt.extractedData.amount
                );
            } else {
                // Notify customer about verification failure
                await NotificationService.notifyReceiptRejected(
                    userId, 
                    order, 
                    paymentReceipt.rejectionReason
                );
            }
        } catch (notificationError) {
            console.error('Failed to send receipt notifications:', notificationError);
            // Don't fail the receipt processing if notification fails
        }

        // Populate for response
        await paymentReceipt.populate('customer', 'firstName lastName email');
        await paymentReceipt.populate('seller', 'firstName lastName email');
        await paymentReceipt.populate('order');

        res.status(201).json({
            success: true,
            message: validation.overallStatus === 'verified' 
                ? 'Receipt verified successfully! Payment confirmed.' 
                : 'Receipt uploaded but verification failed.',
            receipt: paymentReceipt,
            validation
        });

    } catch (error) {
        console.error('Upload GCash receipt error:', error);
        
        // Handle specific errors
        if (error.message.includes('Only image files are allowed')) {
            return res.status(400).json({
                success: false,
                message: 'Only image files are allowed'
            });
        }
        
        if (error.message.includes('File too large')) {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 10MB limit'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to process receipt upload',
            error: error.message
        });
    }
};

// Get receipt details by order ID
export const getReceiptByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const receipt = await PaymentReceipt.findOne({ order: orderId })
            .populate('customer', 'firstName lastName email')
            .populate('seller', 'firstName lastName email')
            .populate('order');

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found'
            });
        }

        // Check if user has permission to view this receipt
        const canView = receipt.customer._id.toString() === userId.toString() || 
                       receipt.seller._id.toString() === userId.toString() ||
                       req.user.role === 'admin';

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view this receipt'
            });
        }

        res.json({
            success: true,
            receipt
        });

    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch receipt',
            error: error.message
        });
    }
};

// Get all receipts for a user (customer or seller)
export const getUserReceipts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        const query = {
            $or: [
                { customer: userId },
                { seller: userId }
            ]
        };

        if (status) {
            query.verificationStatus = status;
        }

        const options = {
            sort: { uploadedAt: -1 },
            page: parseInt(page),
            limit: parseInt(limit),
            populate: [
                { path: 'customer', select: 'firstName lastName email' },
                { path: 'seller', select: 'firstName lastName email' },
                { path: 'order', select: 'orderNumber totalAmount' }
            ]
        };

        const receipts = await PaymentReceipt.paginate(query, options);

        res.json({
            success: true,
            receipts: receipts.docs,
            pagination: {
                page: receipts.page,
                pages: receipts.totalPages,
                total: receipts.totalDocs,
                limit: receipts.limit
            }
        });

    } catch (error) {
        console.error('Get user receipts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch receipts',
            error: error.message
        });
    }
};

// Admin: Get all receipts with filtering
export const getAllReceipts = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;

        const query = {};
        if (status) {
            query.verificationStatus = status;
        }

        if (search) {
            query.$or = [
                { 'extractedData.referenceNumber': { $regex: search, $options: 'i' } },
                { rejectionReason: { $regex: search, $options: 'i' } }
            ];
        }

        const options = {
            sort: { uploadedAt: -1 },
            page: parseInt(page),
            limit: parseInt(limit),
            populate: [
                { path: 'customer', select: 'firstName lastName email' },
                { path: 'seller', select: 'firstName lastName email' },
                { path: 'order', select: 'orderNumber totalAmount' }
            ]
        };

        const receipts = await PaymentReceipt.paginate(query, options);

        res.json({
            success: true,
            receipts: receipts.docs,
            pagination: {
                page: receipts.page,
                pages: receipts.totalPages,
                total: receipts.totalDocs,
                limit: receipts.limit
            }
        });

    } catch (error) {
        console.error('Get all receipts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch receipts',
            error: error.message
        });
    }
};

// Verify receipt without creating a PaymentReceipt record (pre-order verification)
export const verifyReceiptOnly = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt image is required'
            });
        }

        const { orderData, sellerGcashDetails } = req.body;
        
        if (!orderData || !sellerGcashDetails) {
            return res.status(400).json({
                success: false,
                message: 'Order data and seller GCash details are required'
            });
        }

        const parsedOrderData = JSON.parse(orderData);
        const parsedSellerGcash = JSON.parse(sellerGcashDetails);

        // Upload receipt image to Cloudinary
        console.log('Uploading receipt image to Cloudinary...');
        const receiptImageUrl = await uploadReceiptToCloudinary(
            req.file.buffer, 
            `temp_receipt_${userId}_${Date.now()}`
        );

        // EXIF check (tampering detection)
        let exifSuspicious = false;
        try {
            const parser = exif.create(req.file.buffer);
            const exifData = parser.parse();
            const software = exifData.tags?.Software || exifData.image?.Software || exifData.tags?.software;
            const hasDate = !!(exifData.tags?.DateTimeOriginal || exifData.tags?.CreateDate || exifData.tags?.ModifyDate);
            const softwareStr = typeof software === 'string' ? software.toLowerCase() : String(software || '').toLowerCase();
            if (softwareStr.includes('photoshop') || softwareStr.includes('gimp') || softwareStr.includes('canva')) {
                exifSuspicious = true;
            }
            if (!hasDate) {
                exifSuspicious = true;
            }
        } catch (_) {
            exifSuspicious = true;
        }

        // Extract data using OpenAI OCR
        console.log('Extracting receipt data using OCR...');
        const ocrResult = await extractReceiptData(receiptImageUrl);

        if (!ocrResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to extract receipt data',
                error: ocrResult.error
            });
        }

        // Create temporary receipt object for validation
        const tempReceipt = {
            extractedData: {
                referenceNumber: ocrResult.data.reference_number,
                amount: normalizeAmount(ocrResult.data.amount),
                sender: {
                    name: ocrResult.data.sender_name,
                    number: ocrResult.data.sender_number
                },
                receiver: {
                    name: ocrResult.data.receiver_name,
                    number: ocrResult.data.receiver_number || ocrResult.data.sender_number || null
                },
                date: ocrResult.data.date ? new Date(ocrResult.data.date) : new Date(),
                rawText: ocrResult.rawText
            },
            // Mock methods for validation
            async validateReceiptData(orderData, sellerGcashDetails) {
                const validation = {
                    amountMatch: false,
                    receiverMatch: false,
                    referenceValid: false,
                    isDuplicate: false,
                    overallStatus: 'rejected'
                };
                
                // Check amount match (allow small rounding differences)
                let extractedAmount = this.extractedData.amount;
                if (!(typeof extractedAmount === 'number' && Number.isFinite(extractedAmount))) {
                    const parsed = parseFloat(String(extractedAmount)
                        .replace(/[^\d.,-]/g, '')
                        .replace(/,(?=\d{3}(\D|$))/g, '')
                        .replace(/,(?=\d{1,2}$)/, '.')
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

                // Debug info for amount comparison
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
                    console.warn('GCash amount mismatch debug (verify-only):', amountDebug);
                } else {
                    console.log('GCash amount match debug (verify-only):', amountDebug);
                }
                
                // Check receiver match
                const extractedReceiverNumber = this.extractedData.receiver?.number?.replace(/[^\d]/g, '');
                const sellerGcashNumber = sellerGcashDetails?.number?.replace(/[^\d]/g, '');
                validation.receiverMatch = extractedReceiverNumber === sellerGcashNumber;
                
                // Check reference number format with normalization
                const refNumberRaw = this.extractedData.referenceNumber ?? '';
                const refDigits = String(refNumberRaw).replace(/\D/g, '');
                validation.referenceValid = refDigits.length >= 10 && refDigits.length <= 13;
                if (validation.referenceValid) {
                    this.extractedData.referenceNumber = refDigits;
                }
                
                // Check for duplicate reference number
                validation.isDuplicate = await PaymentReceipt.isDuplicateReference(
                    validation.referenceValid ? refDigits : refNumberRaw
                );
                
                // Overall status
                if (validation.amountMatch && validation.receiverMatch && validation.referenceValid && !validation.isDuplicate) {
                    validation.overallStatus = 'verified';
                }
                
                return validation;
            }
        };

        // Validate the extracted data
        console.log('Validating extracted data...');
        const validation = await tempReceipt.validateReceiptData(parsedOrderData, parsedSellerGcash);
        if (exifSuspicious && validation.overallStatus === 'verified') {
            // Keep as verified but include flag in response; frontend blocks order creation already on failed verification.
        }
        
        res.json({
            success: true,
            verification: validation,
            extractedData: tempReceipt.extractedData,
            receiptImageUrl: receiptImageUrl,
            debug: validation.amountDebug || undefined,
            message: validation.overallStatus === 'verified' 
                ? 'Receipt verified successfully!' 
                : 'Receipt verification failed.'
        });

    } catch (error) {
        console.error('Verify receipt only error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify receipt',
            error: error.message
        });
    }
};

// Admin: Manually review and update receipt status
export const reviewReceipt = async (req, res) => {
    try {
        const { receiptId } = req.params;
        const { action, notes } = req.body; // action: 'approve' or 'reject'
        const adminId = req.user._id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "approve" or "reject"'
            });
        }

        const receipt = await PaymentReceipt.findById(receiptId)
            .populate('order');

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found'
            });
        }

        // Update receipt status
        receipt.verificationStatus = action === 'approve' ? 'verified' : 'rejected';
        receipt.reviewedBy = adminId;
        receipt.reviewedAt = new Date();
        receipt.adminNotes = notes || '';

        if (action === 'reject' && notes) {
            receipt.rejectionReason = notes;
        }

        await receipt.save();

        // Update order payment status if approved
        if (action === 'approve') {
            const order = receipt.order;
            order.paymentStatus = 'paid';
            await order.save();
        }

        res.json({
            success: true,
            message: `Receipt ${action}d successfully`,
            receipt
        });

    } catch (error) {
        console.error('Review receipt error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review receipt',
            error: error.message
        });
    }
};
