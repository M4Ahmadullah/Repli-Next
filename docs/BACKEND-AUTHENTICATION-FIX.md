# Backend Authentication Fix Guide

## Issue Description
The Next.js frontend is generating valid Firebase ID tokens but the backend is returning 401 Unauthorized errors. The backend's Firebase authentication middleware is not properly configured to accept tokens from custom sign-ins.

## Current Problem
1. Frontend generates Firebase custom token using `adminAuth.createCustomToken(clerkUserId)`
2. Frontend signs in with custom token using `signInWithCustomToken(customToken)`
3. Frontend gets ID token using `getIdToken()`
4. Frontend sends ID token to backend in Authorization header
5. Backend rejects the token with 401 Unauthorized

## Root Cause
The backend's Firebase authentication middleware is likely configured to only accept tokens from standard Firebase providers (Google, Facebook, etc.) but not from custom sign-ins.

## Required Fixes

### 1. Update Firebase Authentication Middleware

**File:** `src/middleware/auth.ts` or similar

**Current (Problematic) Code:**
```typescript
// ❌ This only works for standard Firebase providers
const decodedToken = await adminAuth.verifyIdToken(token);
```

**Fixed Code:**
```typescript
// ✅ This works for both standard and custom sign-ins
try {
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  // For custom sign-ins, the token will have custom claims
  if (decodedToken.firebase?.sign_in_provider === 'custom') {
    // Extract the Clerk user ID from custom claims
    const clerkUserId = decodedToken.clerkUserId || decodedToken.sub;
    
    // Verify the user exists in your system
    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add user info to request
    req.user = {
      ...decodedToken,
      clerkUserId,
      firebaseUid: decodedToken.uid
    };
  } else {
    // Standard Firebase provider flow
    req.user = decodedToken;
  }
  
  return next();
} catch (error) {
  console.error('Firebase token verification failed:', error);
  return res.status(401).json({
    success: false,
    error: 'Invalid authentication token'
  });
}
```

### 2. Update User Service

**File:** `src/services/user.service.ts` or similar

**Add function to get user by Clerk ID:**
```typescript
async getUserByClerkId(clerkUserId: string) {
  try {
    const userDoc = await this.db
      .collection('users')
      .where('clerkId', '==', clerkUserId)
      .limit(1)
      .get();
    
    if (userDoc.empty) {
      return null;
    }
    
    return {
      id: userDoc.docs[0].id,
      ...userDoc.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting user by Clerk ID:', error);
    return null;
  }
}
```

### 3. Update WhatsApp Connection Endpoint

**File:** `src/routes/whatsapp.ts` or similar

**Current (Problematic) Code:**
```typescript
// ❌ This expects a standard Firebase user
app.post('/api/v1/whatsapp/connect/:botId', authMiddleware, async (req, res) => {
  const { userId } = req.user; // This might be undefined for custom sign-ins
  // ...
});
```

**Fixed Code:**
```typescript
// ✅ This handles both standard and custom sign-ins
app.post('/api/v1/whatsapp/connect/:botId', authMiddleware, async (req, res) => {
  const { clerkUserId, firebaseUid } = req.user;
  
  // Use clerkUserId for user operations
  const user = await getUserByClerkId(clerkUserId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  // Use firebaseUid for Firebase-specific operations
  const { botId } = req.params;
  const { useExistingSession, isNewBotCreation } = req.body;
  
  try {
    // Your existing logic here
    const result = await connectWhatsApp(botId, clerkUserId, {
      useExistingSession,
      isNewBotCreation
    });
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('WhatsApp connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect WhatsApp'
    });
  }
});
```

### 4. Update All Protected Endpoints

Apply the same pattern to all endpoints that use authentication:

- `/api/v1/whatsapp/pending-bots/:userId`
- `/api/v1/whatsapp/qr/:botId`
- `/api/v1/whatsapp/status/:userId`
- Any other protected endpoints

### 5. Testing Steps

1. **Test Token Generation:**
   ```bash
   curl -X GET http://localhost:3000/api/test-auth
   ```

2. **Test Backend Authentication:**
   ```bash
   # Get token from frontend
   TOKEN=$(curl -s http://localhost:3000/api/test-auth | jq -r '.data.firebaseToken')
   
   # Test with backend
   curl -X POST http://localhost:8000/api/v1/whatsapp/connect/test-bot \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","useExistingSession":false,"isNewBotCreation":true}'
   ```

3. **Check Backend Logs:**
   Look for these successful logs:
   ```
   ✅ Firebase token verified successfully
   ✅ User authenticated: user_2zoIWphpDQ0KgCaUbHNOKm6ZA0u
   ✅ WhatsApp connection initiated
   ```

### 6. Expected Logs After Fix

**Successful Authentication:**
```
🔍 [DEBUG] Firebase token received: eyJhbGciOiJSUzI1NiIs...
✅ [DEBUG] Firebase token verified successfully
✅ [DEBUG] User authenticated: user_2zoIWphpDQ0KgCaUbHNOKm6ZA0u
✅ [DEBUG] WhatsApp connection initiated for bot: temp-bot-id
```

**Failed Authentication (Before Fix):**
```
❌ [DEBUG] Firebase token verification failed: Firebase ID token has invalid signature
❌ [DEBUG] Authentication failed: Unauthorized
```

## Implementation Checklist

- [ ] Update Firebase authentication middleware to handle custom sign-ins
- [ ] Add `getUserByClerkId` function to user service
- [ ] Update all protected endpoints to use `clerkUserId` instead of `userId`
- [ ] Test token generation and verification
- [ ] Test WhatsApp connection endpoints
- [ ] Update error handling for authentication failures
- [ ] Add logging for successful authentication
- [ ] Test with real frontend requests

## Environment Variables

Ensure these are set in the backend:
```env
FIREBASE_PROJECT_ID=repli-b4f74
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@repli-b4f74.iam.gserviceaccount.com
```

## Contact

If you need help implementing these fixes, please provide:
1. Current authentication middleware code
2. Error logs from failed authentication attempts
3. Backend environment configuration 