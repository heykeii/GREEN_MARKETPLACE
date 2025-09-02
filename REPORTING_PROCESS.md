# Green Marketplace Reporting Process

## Overview

The Green Marketplace implements a comprehensive reporting system that allows users to report inappropriate content, fake products, scams, harassment, and other violations. The system provides a structured workflow for handling reports from submission to resolution.

## Report Types

Users can report the following types of items:

1. **Products** - Fake products, poor quality, inappropriate content, copyright violations
2. **Users** - Harassment, scams, spam, inappropriate behavior
3. **Reviews** - Fake reviews, spam, inappropriate content, harassment
4. **Orders** - Wrong items, poor quality, scams

## Report Reasons

### Product Reports
- Inappropriate Content
- Fake Product
- Poor Quality
- Wrong Item
- Scam
- Copyright Violation
- Other

### User Reports
- Harassment
- Scam
- Spam
- Inappropriate Content
- Other

### Review Reports
- Inappropriate Content
- Spam
- Fake Review
- Harassment
- Other

### Order Reports
- Wrong Item
- Poor Quality
- Scam
- Other

## Report Status Flow

```
pending → investigating → resolved/dismissed
```

### Status Descriptions

1. **Pending** - Report submitted, awaiting admin review
2. **Investigating** - Admin is actively investigating the report
3. **Resolved** - Report has been resolved with appropriate action taken
4. **Dismissed** - Report was dismissed as invalid or no action needed

## Resolution Actions

When resolving reports, admins can take the following actions:

1. **Warning Issued** - Send a warning to the reported user
2. **Item Removed** - Remove the reported product/review from the platform
3. **User Suspended** - Temporarily suspend the user account (7 days)
4. **User Banned** - Permanently ban the user from the platform
5. **Refund Issued** - Issue a refund for the reported order
6. **No Action** - No action taken after investigation
7. **Other** - Custom action taken

## User Process

### Submitting a Report

1. User identifies content that violates platform policies
2. User clicks the "Report" button on the item
3. User fills out the report form:
   - Selects reason for report
   - Provides detailed description (max 1000 characters)
   - Optionally uploads evidence (screenshots, images)
4. Report is submitted and assigned a unique report number
5. User receives confirmation of submission

### Tracking Reports

1. Users can view their submitted reports at `/my-reports`
2. Users can filter reports by status
3. Users can see admin responses and resolutions
4. Users receive notifications when report status changes

## Admin Process

### Managing Reports

1. Admins access the report management dashboard at `/admin/report-management`
2. Admins can view all reports with filtering options:
   - By status
   - By reason
   - By item type
   - By date range

### Report Workflow

1. **Review Pending Reports**
   - Admins review new reports in the pending queue
   - Admins can start investigation or dismiss reports

2. **Investigation Phase**
   - Admins mark reports as "investigating"
   - Admins can add admin responses to communicate with reporters
   - Admins gather additional information if needed

3. **Resolution**
   - Admins select appropriate action based on investigation
   - System automatically applies the selected action (remove item, suspend user, etc.)
   - Report is marked as resolved with resolution notes

### Admin Dashboard Features

- **Statistics Overview**: Total reports, pending, investigating, resolved, dismissed
- **Filtering**: Filter by status, reason, item type, date
- **Bulk Actions**: Process multiple reports efficiently
- **Report Details**: View full report information including evidence
- **Action History**: Track all actions taken on reports

## Technical Implementation

### Backend API Endpoints

#### User Endpoints
- `POST /api/v1/reports/create` - Create a new report
- `GET /api/v1/reports/my-reports` - Get user's reports
- `GET /api/v1/reports/:reportId` - Get specific report

#### Admin Endpoints
- `GET /api/v1/reports/admin/all` - Get all reports with filtering
- `GET /api/v1/reports/admin/stats` - Get report statistics
- `PATCH /api/v1/reports/admin/:reportId/status` - Update report status
- `POST /api/v1/reports/admin/:reportId/resolve` - Resolve report with action

### Database Schema

The reports are stored with the following structure:

```javascript
{
  reporter: ObjectId,           // User who submitted the report
  reportedItem: {
    type: String,               // 'product', 'user', 'review', 'order'
    itemId: ObjectId            // ID of the reported item
  },
  reason: String,               // Reason for report
  description: String,          // Detailed description
  evidence: [String],           // Array of evidence URLs
  status: String,               // 'pending', 'investigating', 'resolved', 'dismissed'
  adminResponse: String,        // Admin's response to reporter
  resolution: {
    action: String,             // Action taken
    notes: String               // Resolution notes
  },
  reportNumber: String,         // Auto-generated report number
  timestamps: true
}
```

### Frontend Components

1. **ReportForm** - Form for submitting reports
2. **ReportButton** - Reusable button component for triggering report forms
3. **AdminReportManagement** - Admin dashboard for managing reports
4. **MyReports** - User page for viewing their reports

## Security Considerations

1. **Authentication Required** - All report operations require user authentication
2. **Admin Authorization** - Admin endpoints require admin privileges
3. **Rate Limiting** - Users can only submit one report per item
4. **Input Validation** - All report data is validated on both frontend and backend
5. **Evidence Storage** - Evidence files are stored securely with proper access controls

## Best Practices

### For Users
1. Provide detailed descriptions when reporting
2. Include relevant evidence when available
3. Only report genuine violations
4. Be patient during the investigation process

### For Admins
1. Investigate reports thoroughly before taking action
2. Provide clear responses to reporters
3. Take appropriate action based on severity
4. Document all decisions and actions
5. Maintain consistency in enforcement

## Monitoring and Analytics

The system provides analytics on:
- Report volume by type and reason
- Average resolution time
- Most common violation types
- Admin workload distribution
- User satisfaction with resolutions

This data helps improve the platform's safety and user experience.
