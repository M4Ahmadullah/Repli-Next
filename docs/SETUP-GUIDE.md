# 🚀 Repli Platform Setup Guide

## Overview
This guide will help you set up the Repli platform with Clerk authentication, Firebase database integration, and the proper environment configuration.

## Prerequisites
- Node.js 18+ installed
- Firebase project created
- Clerk account set up
- Git installed

## 🔧 Step 1: Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Bot API Configuration (for bot integration)
BOT_API_URL=http://localhost:4000
BOT_API_KEY=your_bot_api_key_here

# WhatsApp Business API Configuration (optional)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

## 🔐 Step 2: Clerk Setup

### 2.1 Create Clerk Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.dev)
2. Create a new application
3. Choose "Email and Password" as authentication method
4. Copy the publishable key and secret key to your `.env.local`

### 2.2 Configure Clerk Webhooks
1. In Clerk Dashboard, go to "Webhooks"
2. Create a new webhook endpoint: `http://localhost:3000/api/webhooks/clerk`
3. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the webhook secret to your `.env.local`

### 2.3 Set Up Clerk Pages
The app is configured to use Clerk's hosted pages:
- Sign In: `/sign-in`
- Sign Up: `/sign-up`
- User Profile: `/user-profile`

## 🔥 Step 3: Firebase Setup

### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings → General → Your apps
5. Create a web app and copy the config values

### 3.2 Set Up Firebase Admin
1. Go to Project Settings → Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Copy the required values to your `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 3.3 Configure Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🏃‍♂️ Step 4: Installation & Running

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Start Development Server
```bash
npm run dev
```

### 4.3 Test the Setup
1. Navigate to `http://localhost:3000`
2. Click "Start Free Trial" to test sign-up
3. Sign up with a test email
4. Verify that the user is created in Firebase
5. Check that the dashboard loads correctly

## 🤖 Step 5: Bot Integration (Optional)

The platform is designed to work with a separate bot service. See `BOT-AUTHENTICATION-INTEGRATION.md` for detailed integration instructions.

### 5.1 Bot API Endpoints
The Next.js app provides these endpoints for bot integration:
- `POST /api/auth/verify-phone` - Verify user by phone number
- `POST /api/auth/update-usage` - Update message usage
- `POST /api/bot/conversations` - Log conversations

## 🎨 Step 6: Customization

### 6.1 Theme Configuration
The app uses WhatsApp green (`#25D366`) as the primary color. You can customize this in:
- `tailwind.config.js`
- `src/components/providers/clerk-provider.tsx`

### 6.2 Plan Limits
Update subscription plans and limits in:
- `src/lib/types/user.ts` (PLAN_LIMITS constant)

## 🔍 Step 7: Testing

### 7.1 Authentication Flow
1. Test sign-up process
2. Verify user creation in Firebase
3. Test sign-in process
4. Test dashboard access

### 7.2 API Endpoints
Use tools like Postman or curl to test:
```bash
# Get user data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/USER_ID

# Update user settings
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"settings":{"botPersonality":"friendly"}}' \
  http://localhost:3000/api/users/USER_ID
```

## 🚨 Troubleshooting

### Common Issues

**1. Firebase Permission Denied**
- Check Firestore rules
- Ensure user is authenticated
- Verify Firebase project configuration

**2. Clerk Webhook Not Working**
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure webhook events are selected

**3. User Not Created in Firebase**
- Check webhook is configured correctly
- Verify webhook endpoint is working
- Check server logs for errors

**4. Environment Variables Not Loading**
- Ensure `.env.local` file exists
- Restart development server
- Check variable names match exactly

## 📚 Next Steps

1. **Phase 2**: Set up bot development environment
2. **Phase 3**: Implement conversation logging and analytics
3. **Phase 4**: Add AI training interface
4. **Phase 5**: Implement subscription and billing

## 🆘 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure Firebase and Clerk configurations are correct
4. Review the logs in both services

## 🎯 Key Features Implemented

✅ **Authentication**: Clerk integration with Firebase sync  
✅ **User Management**: Complete CRUD operations  
✅ **Dashboard**: Real-time user data and bot status  
✅ **API Integration**: Ready for bot service connection  
✅ **Responsive UI**: Modern design with WhatsApp theming  
✅ **Webhook Integration**: Automatic user synchronization  

The platform is now ready for Phase 2 development! 