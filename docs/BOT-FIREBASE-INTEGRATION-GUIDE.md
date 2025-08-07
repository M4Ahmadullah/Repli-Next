# Repli Bot Firebase Integration Guide

## Authentication and User Management

### 1. Authentication Flow
- We use Clerk for frontend authentication
- Firebase Authentication will be used as a secondary authentication layer for the bot system
- User synchronization happens through a dedicated sync endpoint

### 2. User Synchronization Endpoint
When a user is created/updated in Clerk, use the following endpoint to sync user data:

```http
POST /api/bot/sync-user
```

#### Payload Structure
```typescript
interface BotUserContext {
  userId: string
  phoneNumber?: string
  settings: {
    businessName?: string
    businessDescription?: string
    botPersonality: 'professional' | 'friendly' | 'casual'
    customInstructions?: string
    autoRespond: boolean
    businessHours: {
      enabled: boolean
      timezone: string
      schedule: {
        [key: string]: { 
          start: string
          end: string
          enabled: boolean 
        }
      }
    }
  }
  subscription: {
    plan: 'free' | 'starter' | 'growth' | 'enterprise'
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
    dailyLimit: number
  }
}
```

### 3. Firestore User Document Structure
```typescript
interface FirestoreUser {
  id: string // Clerk User ID
  email: string
  name?: string
  image?: string
  whatsappPhoneNumber?: string
  subscription: {
    plan: 'free' | 'starter' | 'growth' | 'enterprise'
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
    dailyLimit: number
  }
  bots: Bot[]
  settings: {
    botPersonality: 'professional' | 'friendly' | 'casual'
    autoRespond: boolean
    businessHours: {
      enabled: boolean
      timezone: string
      schedule: Record<string, { start: string, end: string, enabled: boolean }>
    }
  }
}
```

### 4. Firebase Authentication Integration
- Use Firebase Authentication as a secondary authentication mechanism
- Implement token verification for bot system API calls
- Sync Clerk user ID with Firebase user ID

### 5. Security Rules
Implement Firestore security rules to enforce:
- Users can only read/write their own documents
- Validate document structure
- Enforce subscription and bot creation limits

### 6. Error Handling
- Implement robust error handling for authentication failures
- Log authentication and synchronization errors
- Provide clear error messages for debugging

### 7. Best Practices
- Always validate user tokens before processing requests
- Use environment-specific configurations
- Implement rate limiting and request throttling
- Securely manage API keys and tokens

### 8. Recommended Firebase Setup
1. Create separate Firebase projects for development, staging, and production
2. Use Firebase Admin SDK for server-side operations
3. Configure Firebase Authentication to allow email/password and potentially other providers

### 9. Monitoring and Logging
- Implement comprehensive logging for authentication events
- Set up Firebase Authentication monitoring
- Create alerts for suspicious authentication activities

### 10. Migration Considerations
- Existing users will have Clerk user IDs
- Ensure smooth migration of existing user data
- Maintain backwards compatibility during transition

## Example Firebase Authentication Verification

```python
def verify_firebase_token(id_token):
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_admin.auth().verify_id_token(id_token)
        uid = decoded_token['uid']
        return uid
    except (ValueError, firebase_admin.auth.InvalidIdTokenError):
        # Handle invalid token
        return None
```

## Troubleshooting
- Ensure all environment variables are correctly set
- Check network connectivity
- Verify token generation and validation
- Monitor Firebase Authentication logs

## Contact
For any integration issues, contact the backend team at backend@repli.ai 