#!/bin/bash

# Environment Setup Script for Green Marketplace
echo "Setting up environment variables for Green Marketplace..."

# Create .env file in server directory
cat > server/.env << 'EOF'
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/green_marketplace

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production_$(date +%s)

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration (Required for image uploads)
# Get these from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Optional - for notifications)
EMAIL_FROM=noreply@greenmarketplace.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OpenAI Configuration (Optional - for AI features)
OPENAI_API_KEY=your_openai_api_key

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend API Key (Optional - for email sending)
RESEND_API_KEY=your_resend_api_key
EOF

echo "✅ Created server/.env file"
echo ""
echo "⚠️  IMPORTANT: You need to configure the following required variables:"
echo "   1. CLOUDINARY_CLOUD_NAME"
echo "   2. CLOUDINARY_API_KEY" 
echo "   3. CLOUDINARY_API_SECRET"
echo ""
echo "   Get these from: https://cloudinary.com/console"
echo ""
echo "   Edit server/.env and replace the placeholder values with your actual credentials."
echo ""
echo "🚀 After configuring Cloudinary, restart your server and try creating a campaign again."
