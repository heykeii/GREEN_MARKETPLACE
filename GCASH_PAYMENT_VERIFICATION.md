# GCash Payment Verification System

## Overview

The GCash Payment Verification System enables automated verification of buyer payments for seller-based GCash transactions. The system uses AI-powered OCR to extract payment details from uploaded receipts and validates them against order information.

## Process Flow

### 1. Order Creation
- Buyer selects GCash as payment method during checkout
- Order is created with status "pending" and `gcashReceiptStatus: "required"`
- Buyer sees seller's GCash details (number and QR code)
- Order is placed without requiring immediate receipt upload

### 2. Payment & Receipt Upload
- Buyer sends payment to seller's GCash account
- Buyer uploads screenshot/photo of payment receipt on order details page
- Receipt is stored in Cloudinary for permanent access

### 3. AI-Powered OCR Extraction
- Receipt image is sent to OpenAI Vision API (GPT-4o-mini)
- AI extracts key information:
  - Reference number (10-13 digits)
  - Payment amount
  - Sender name/number
  - Receiver name/number
  - Transaction date/time

### 4. Automated Validation
The system validates extracted data against:
- **Amount Match**: Payment amount matches order total (±₱0.01 tolerance)
- **Receiver Match**: Receiver's GCash number matches seller's registered number
- **Reference Format**: Valid GCash reference number format
- **Duplicate Check**: Reference number hasn't been used before

### 5. Result Handling
- ✅ **If Valid**: Order marked as "paid", notifications sent to buyer and seller
- ❌ **If Invalid**: Receipt rejected with specific reasons, buyer can re-upload

### 6. Notifications
- **Buyer**: Notified of verification success/failure
- **Seller**: Notified when payment is confirmed
- **Admin**: Notified if manual review needed

## Technical Implementation

### Backend Components

#### Models
- **PaymentReceipt** (`server/models/paymentReceipt.model.js`)
  - Stores receipt images, extracted data, validation results
  - Includes duplicate prevention and validation methods
  
- **Order** (`server/models/orders.model.js`)
  - Extended with `gcashReceiptStatus` field
  - Tracks receipt upload and verification status

#### Controllers
- **PaymentReceipt Controller** (`server/controllers/paymentReceipt.controller.js`)
  - Handles file uploads with Multer
  - Integrates OpenAI Vision API for OCR
  - Implements validation logic
  - Manages notifications

#### Routes
- **Payment Receipt Routes** (`server/routes/paymentReceipt.route.js`)
  ```
  POST   /api/v1/payment-receipts/upload        # Upload receipt
  GET    /api/v1/payment-receipts/order/:id    # Get receipt by order
  GET    /api/v1/payment-receipts/my-receipts  # User's receipts
  GET    /api/v1/payment-receipts/admin/all    # Admin: All receipts
  PUT    /api/v1/payment-receipts/admin/:id/review # Admin: Manual review
  ```

#### Notifications
- Extended `NotificationService` with GCash-specific notifications
- Real-time notifications via Socket.IO
- Email notifications (if configured)

### Frontend Components

#### GCash Receipt Upload Component
- **File**: `client/src/components/GCashReceiptUpload.jsx`
- **Features**:
  - File upload with preview
  - Real-time status updates
  - Extracted data display
  - Re-upload for rejected receipts
  - Status badges (pending, processing, verified, rejected)

#### Integration Points
- **Checkout Page**: Shows payment instructions (no upload required)
- **Order Details Page**: Displays receipt upload component for GCash orders
- **Notifications**: Real-time updates on verification status

## Environment Configuration

### Required Environment Variables
```env
# OpenAI Configuration
OPENAI_API_SECRET=your_openai_api_key

# Cloudinary Configuration (already configured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database Indexes
The system creates optimized indexes for:
- Reference number uniqueness
- Order-receipt relationships
- User receipt queries
- Admin filtering

## API Endpoints

### Customer Endpoints

#### Upload Receipt
```http
POST /api/v1/payment-receipts/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- receipt: File (image)
- orderId: String
```

#### Get Receipt by Order
```http
GET /api/v1/payment-receipts/order/:orderId
Authorization: Bearer <token>
```

#### Get User Receipts
```http
GET /api/v1/payment-receipts/my-receipts?status=verified&page=1&limit=10
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Receipts
```http
GET /api/v1/payment-receipts/admin/all?status=pending&search=REF123
Authorization: Bearer <admin_token>
```

#### Manual Review
```http
PUT /api/v1/payment-receipts/admin/:receiptId/review
Content-Type: application/json
Authorization: Bearer <admin_token>

Body:
{
  "action": "approve", // or "reject"
  "notes": "Manual verification completed"
}
```

## Security Features

### File Upload Security
- **File Type Validation**: Only image files accepted
- **File Size Limit**: 10MB maximum
- **Virus Scanning**: Cloudinary provides automatic scanning
- **Access Control**: User authentication required

### Data Protection
- **Reference Number Uniqueness**: Prevents duplicate submissions
- **User Authorization**: Users can only access their own receipts
- **Admin Permissions**: Administrative functions require admin role
- **Audit Trail**: Complete transaction history maintained

### API Security
- **Rate Limiting**: Prevents abuse of upload endpoints
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Secure error messages without data leakage

## Error Handling

### Common Error Scenarios

#### Upload Errors
- Invalid file type → User-friendly error message
- File too large → Size limit guidance
- Network errors → Retry mechanism

#### OCR Errors
- Poor image quality → Request clearer image
- OpenAI API failure → Graceful degradation
- Invalid extracted data → Manual review option

#### Validation Errors
- Amount mismatch → Specific error with expected vs actual
- Wrong receiver → Seller account information
- Duplicate reference → Previous usage details

## Performance Considerations

### Optimization Features
- **Pagination**: Large receipt lists paginated
- **Image Optimization**: Cloudinary auto-optimization
- **Database Indexes**: Optimized for common queries
- **Caching**: Static assets cached via CDN

### Scalability
- **Async Processing**: OCR processing doesn't block UI
- **Background Jobs**: Notifications sent asynchronously
- **Database Sharding**: Ready for horizontal scaling
- **CDN Integration**: Global image delivery

## Testing

### Manual Testing Checklist
1. **Order Creation**
   - [ ] GCash payment method selection
   - [ ] Seller GCash details display
   - [ ] Order creation without receipt

2. **Receipt Upload**
   - [ ] File selection and preview
   - [ ] Upload progress indication
   - [ ] Error handling for invalid files

3. **OCR Processing**
   - [ ] Successful data extraction
   - [ ] Handling of poor quality images
   - [ ] Error recovery for API failures

4. **Validation**
   - [ ] Correct amount validation
   - [ ] Receiver account matching
   - [ ] Duplicate prevention
   - [ ] Reference number format validation

5. **Notifications**
   - [ ] Success notifications
   - [ ] Failure notifications
   - [ ] Seller payment confirmations

### Sample Test Cases

#### Valid Receipt Test
```javascript
// Test data for a valid GCash receipt
{
  "reference_number": "1234567890",
  "amount": 1200.00,
  "sender_name": "Maria Santos",
  "sender_number": "09171234567",
  "receiver_name": "Pedro Reyes",
  "receiver_number": "09189876543",
  "date": "2025-09-21T17:20:00.000Z"
}
```

#### Invalid Receipt Test Cases
1. **Amount Mismatch**: Receipt shows ₱1000, order total ₱1200
2. **Wrong Receiver**: Receipt shows different GCash number
3. **Invalid Reference**: Reference number too short/long
4. **Duplicate Reference**: Same reference number used before

## Troubleshooting

### Common Issues

#### OpenAI API Errors
- Check `OPENAI_API_SECRET` environment variable
- Verify API quota and billing status
- Monitor rate limiting

#### Cloudinary Upload Failures
- Verify Cloudinary credentials
- Check storage quota
- Monitor upload bandwidth

#### Database Connection Issues
- Verify MongoDB connection
- Check database indexes
- Monitor query performance

#### Notification Failures
- Check Socket.IO connection
- Verify notification service configuration
- Monitor notification delivery rates

### Debug Tools
- **Server Logs**: Detailed logging for all operations
- **Error Monitoring**: Structured error reporting
- **Performance Metrics**: Response time tracking
- **Usage Analytics**: Receipt processing statistics

## Future Enhancements

### Planned Features
1. **Bulk Receipt Processing**: Handle multiple receipts
2. **Receipt Templates**: Support different receipt formats
3. **Machine Learning**: Improve OCR accuracy over time
4. **Mobile App**: Native mobile receipt capture
5. **Webhook Integration**: Real-time partner notifications

### Advanced Validation
1. **Bank Integration**: Direct GCash API validation
2. **Blockchain Verification**: Immutable receipt records
3. **Biometric Verification**: Enhanced security measures
4. **Risk Scoring**: Fraud detection algorithms

## Support

### Documentation
- API documentation available at `/api/docs`
- Database schema documentation in `/docs/database`
- Frontend component documentation in Storybook

### Contact
- Technical issues: Create GitHub issue
- Business inquiries: Contact support team
- Security concerns: security@greenmarketplace.com

---

## Summary

The GCash Payment Verification System provides a complete, automated solution for verifying seller-based GCash payments. With AI-powered OCR, comprehensive validation, and real-time notifications, it ensures secure and efficient payment processing while maintaining an excellent user experience.

Key benefits:
- **Automated Processing**: Reduces manual verification effort
- **High Accuracy**: AI-powered extraction with validation
- **User-Friendly**: Simple upload and clear status tracking
- **Secure**: Multiple layers of validation and fraud prevention
- **Scalable**: Designed for high-volume transactions
- **Auditable**: Complete transaction history and logging
