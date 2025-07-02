# 🔐 **REPLI BOT - AUTHENTICATION INTEGRATION GUIDE**

**Version:** 2.0.0  
**Last Updated:** December 2024  
**Target:** Bot Development Team  
**Authentication Provider:** Clerk.dev + Next.js API  

---

## 📋 **TABLE OF CONTENTS**

1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Integration Examples](#integration-examples)
5. [Security Guidelines](#security-guidelines)
6. [Error Handling](#error-handling)
7. [Testing & Validation](#testing--validation)
8. [Environment Setup](#environment-setup)

---

## 🏗️ **SYSTEM OVERVIEW**

### **Architecture**
```
WhatsApp User → Bot System → Next.js API → Clerk Auth → Firebase Database
                    ↓              ↓           ↓            ↓
                User Message → JWT Token → User Verification → User Data
```

### **Key Components**
- **Clerk.dev**: Primary authentication provider
- **Next.js API Routes**: Authentication endpoints
- **Firebase Firestore**: User data storage
- **JWT Tokens**: Stateless session management
- **Role-Based Access**: User/Admin permissions

### **Why This Approach?**
✅ **Centralized Auth**: Single source of truth for user authentication  
✅ **Scalable**: Stateless JWT tokens enable horizontal scaling  
✅ **Secure**: Industry-standard token-based authentication  
✅ **Separation of Concerns**: Bot handles messaging, Next.js handles auth  
✅ **Real-time Sync**: User data changes immediately reflected in bot context  

---

## 🔄 **AUTHENTICATION FLOW**

### **1. User Registration/Login (Web App)**
```
User → Web App → Clerk → JWT Token → Firebase → User Profile Created
```

### **2. Bot Authentication Flow**
```
WhatsApp Message → Bot → API /verify-phone → Firebase → User Context → Bot Response
```

### **3. Session Management**
- **Token Expiry**: 1 hour (configurable)
- **Refresh Strategy**: Automatic via Clerk SDK
- **Revocation**: Immediate via Clerk admin
- **Validation**: Real-time via API calls

---

## 🔗 **API ENDPOINTS**

### **Base URL**
```
Production: https://your-app-domain.com/api
Development: http://localhost:3000/api
```

### **Authentication Endpoints**

#### **1. Verify User by Phone Number**
```http
POST /api/auth/verify-phone
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-bot-api-key": "your-bot-api-key"
}
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "platform": "whatsapp"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123abc",
    "clerkId": "user_123abc", 
    "email": "john@example.com",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "subscription": {
      "plan": "starter",
      "status": "active",
      "dailyLimit": 100,
      "monthlyLimit": 3000
    },
    "settings": {
      "whatsappConnected": true,
      "botPersonality": "professional",
      "autoRespond": true,
      "businessName": "John's Business",
      "businessDescription": "A great business",
      "customInstructions": "Always be helpful and professional",
      "businessHours": {
        "enabled": true,
        "timezone": "America/New_York",
        "schedule": {
          "monday": { "start": "09:00", "end": "17:00", "enabled": true },
          "tuesday": { "start": "09:00", "end": "17:00", "enabled": true }
        }
      }
    },
    "botContext": {
      "canReceiveMessages": true,
      "dailyMessagesUsed": 15,
      "remainingMessages": 85,
      "isBusinessHours": true,
      "lastActiveAt": "2024-12-19T10:30:00Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

#### **2. Update User Usage**
```http
POST /api/auth/update-usage
```

**Request Body:**
```json
{
  "userId": "user_123abc",
  "messageCount": 1,
  "action": "message_sent"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "usage": {
    "dailyMessages": 16,
    "remainingMessages": 84,
    "limitReached": false
  }
}
```

#### **3. Validate Session Token** (Optional - for admin features)
```http
POST /api/auth/validate-token
```

**Request Body:**
```json
{
  "token": "jwt_token_here",
  "requiredRole": "admin" // optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_123abc",
    "role": "admin",
    "permissions": ["read_users", "manage_bots"]
  }
}
```

### **User Management Endpoints**

#### **4. Get User Profile**
```http
GET /api/users/{userId}
```

**Headers:**
```json
{
  "x-bot-api-key": "your-bot-api-key"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "subscription": { /* subscription details */ },
    "settings": { /* user settings */ },
    "botStatus": {
      "isActive": true,
      "health": "healthy",
      "stats": {
        "todayMessages": 16,
        "totalMessages": 450,
        "successRate": 95
      }
    }
  }
}
```

#### **5. Update User Settings**
```http
PUT /api/users/{userId}/settings
```

**Request Body:**
```json
{
  "settings": {
    "autoRespond": false,
    "botPersonality": "friendly",
    "customInstructions": "Updated instructions"
  }
}
```

### **Bot Management Endpoints**

#### **6. Log Conversation**
```http
POST /api/bot/conversations
```

**Request Body:**
```json
{
  "userId": "user_123abc",
  "conversation": {
    "from": "+1234567890",
    "userMessage": "Hello, I need help",
    "botResponse": "Hi! How can I assist you today?",
    "timestamp": "2024-12-19T10:30:00Z",
    "messageId": "msg_123",
    "successful": true
  }
}
```

#### **7. Check Usage Limits**
```http
GET /api/bot/limits/{userId}
```

**Success Response (200):**
```json
{
  "success": true,
  "limits": {
    "dailyLimit": 100,
    "dailyUsed": 16,
    "monthlyLimit": 3000,
    "monthlyUsed": 450,
    "canSendMessage": true,
    "resetTime": "2024-12-20T00:00:00Z"
  }
}
```

---

## 💻 **INTEGRATION EXAMPLES**

### **Bot Service Implementation (Node.js)**

#### **1. Authentication Service**
```javascript
class AuthService {
  constructor() {
    this.baseURL = process.env.NEXTJS_API_URL
    this.botApiKey = process.env.BOT_API_KEY
  }

  async verifyUser(phoneNumber) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-api-key': this.botApiKey
        },
        body: JSON.stringify({
          phoneNumber,
          platform: 'whatsapp'
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Authentication failed')
      }

      return data.user
    } catch (error) {
      console.error('Auth verification failed:', error)
      return null
    }
  }

  async updateUsage(userId, messageCount = 1) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/update-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-api-key': this.botApiKey
        },
        body: JSON.stringify({
          userId,
          messageCount,
          action: 'message_sent'
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Usage update failed:', error)
      return { success: false }
    }
  }

  async logConversation(userId, conversation) {
    try {
      const response = await fetch(`${this.baseURL}/api/bot/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-api-key': this.botApiKey
        },
        body: JSON.stringify({
          userId,
          conversation
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Conversation logging failed:', error)
      return { success: false }
    }
  }
}

module.exports = { AuthService }
```

#### **2. Message Handler Implementation**
```javascript
const { AuthService } = require('./auth-service')

class MessageHandler {
  constructor() {
    this.authService = new AuthService()
  }

  async processMessage(message) {
    const { from, body, timestamp } = message
    
    try {
      // 1. Authenticate user by phone number
      const user = await this.authService.verifyUser(from)
      
      if (!user) {
        return this.sendUnauthorizedResponse(from)
      }

      // 2. Check if user can receive messages
      if (!user.botContext.canReceiveMessages) {
        return this.sendLimitExceededResponse(from, user)
      }

      // 3. Check business hours
      if (user.settings.businessHours.enabled && !user.botContext.isBusinessHours) {
        return this.sendBusinessHoursResponse(from, user)
      }

      // 4. Generate AI response
      const aiResponse = await this.generateAIResponse(body, user)

      // 5. Send response and update usage
      await this.sendWhatsAppMessage(from, aiResponse)
      await this.authService.updateUsage(user.id, 1)

      return { success: true }

    } catch (error) {
      console.error('Message processing failed:', error)
      
      // Log error conversation
      if (user) {
        await this.authService.logConversation(user.id, {
          from,
          userMessage: body,
          botResponse: 'Error processing message',
          timestamp: new Date().toISOString(),
          successful: false,
          error: error.message
        })
      }

      return { success: false, error: error.message }
    }
  }

  async generateAIResponse(message, user) {
    const context = {
      businessName: user.settings.businessName,
      businessDescription: user.settings.businessDescription,
      personality: user.settings.botPersonality,
      customInstructions: user.settings.customInstructions,
      userMessage: message
    }

    // Your AI generation logic here
    return `Hi! I'm ${context.businessName}'s AI assistant. How can I help you today?`
  }

  sendUnauthorizedResponse(phoneNumber) {
    return this.sendWhatsAppMessage(
      phoneNumber, 
      "Hello! To use this bot, please sign up at https://your-app.com/signup"
    )
  }

  sendLimitExceededResponse(phoneNumber, user) {
    const resetTime = new Date(user.botContext.resetTime).toLocaleString()
    return this.sendWhatsAppMessage(
      phoneNumber,
      `You've reached your daily message limit (${user.subscription.dailyLimit}). Your limit resets at ${resetTime}. Upgrade your plan for more messages!`
    )
  }

  sendBusinessHoursResponse(phoneNumber, user) {
    const schedule = user.settings.businessHours.schedule
    const hours = Object.entries(schedule)
      .filter(([day, config]) => config.enabled)
      .map(([day, config]) => `${day}: ${config.start}-${config.end}`)
      .join('\n')
    
    return this.sendWhatsAppMessage(
      phoneNumber,
      `Thanks for contacting us! We're currently outside business hours.\n\nOur hours are:\n${hours}\n\nWe'll respond as soon as possible!`
    )
  }

  async sendWhatsAppMessage(to, message) {
    // Your WhatsApp sending logic here
    // Return message ID and processing time
    return {
      id: 'msg_' + Date.now(),
      processingTime: 1.2
    }
  }
}

module.exports = { MessageHandler }
```

#### **3. Webhook Handler**
```javascript
const express = require('express')
const { MessageHandler } = require('./message-handler')

const app = express()
const messageHandler = new MessageHandler()

app.use(express.json())

// WhatsApp webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { messages } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid webhook payload' })
    }

    // Process each message
    for (const message of messages) {
      await messageHandler.processMessage(message)
    }

    res.status(200).json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Repli Bot Service'
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`)
})
```

---

## 🛡️ **SECURITY GUIDELINES**

### **API Key Management**
```env
# Bot Environment Variables
BOT_API_KEY=your-secure-bot-api-key
NEXTJS_API_URL=https://your-app-domain.com
```

### **Request Validation**
- ✅ Always include `x-bot-api-key` header
- ✅ Validate phone number format before API calls
- ✅ Sanitize user input before processing
- ✅ Implement rate limiting on bot side
- ✅ Use HTTPS for all API communications

### **Error Security**
- ❌ Never expose internal error details to users
- ❌ Don't log sensitive user data
- ❌ Avoid caching authentication responses
- ✅ Use generic error messages for users
- ✅ Log detailed errors internally only

### **Data Privacy**
- ✅ Only request necessary user data
- ✅ Respect user privacy settings
- ✅ Implement message retention policies
- ✅ Allow users to delete their data

---

## ⚠️ **ERROR HANDLING**

### **Common Error Codes**
| Code | HTTP Status | Description | Bot Action |
|------|-------------|-------------|------------|
| `USER_NOT_FOUND` | 404 | Phone number not registered | Send signup link |
| `LIMIT_EXCEEDED` | 429 | Daily/monthly limit reached | Send upgrade message |
| `BUSINESS_HOURS` | 200 | Outside business hours | Send hours message |
| `ACCOUNT_SUSPENDED` | 403 | User account suspended | Send contact support |
| `INVALID_TOKEN` | 401 | API key invalid | Log error, retry |
| `RATE_LIMITED` | 429 | Too many requests | Implement backoff |

### **Error Response Format**
```json
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

### **Retry Strategy**
```javascript
async function retryRequest(requestFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      if (attempt === maxRetries || error.status === 404) {
        throw error
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

---

## 🧪 **TESTING & VALIDATION**

### **Test Cases**

#### **1. User Authentication Tests**
```javascript
// Test user verification
const testUser = await authService.verifyUser('+1234567890')
assert(testUser.id === 'expected_user_id')

// Test non-existent user
const noUser = await authService.verifyUser('+9999999999')
assert(noUser === null)
```

#### **2. Usage Limit Tests**
```javascript
// Test daily limit enforcement
const user = await authService.verifyUser('+1234567890')
assert(user.botContext.remainingMessages >= 0)

// Test limit exceeded
if (user.botContext.remainingMessages === 0) {
  assert(user.botContext.canReceiveMessages === false)
}
```

#### **3. Business Hours Tests**
```javascript
// Test business hours logic
const user = await authService.verifyUser('+1234567890')
if (user.settings.businessHours.enabled) {
  // Verify isBusinessHours calculation
  const now = new Date()
  const isBusinessHours = calculateBusinessHours(now, user.settings.businessHours)
  assert(user.botContext.isBusinessHours === isBusinessHours)
}
```

### **API Testing Tools**

#### **cURL Examples**
```bash
# Test user verification
curl -X POST https://your-app.com/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -H "x-bot-api-key: your-api-key" \
  -d '{"phoneNumber": "+1234567890", "platform": "whatsapp"}'

# Test usage update
curl -X POST https://your-app.com/api/auth/update-usage \
  -H "Content-Type: application/json" \
  -H "x-bot-api-key: your-api-key" \
  -d '{"userId": "user_123", "messageCount": 1, "action": "message_sent"}'
```

#### **Postman Collection**
```json
{
  "info": {
    "name": "Repli Bot API",
    "description": "API endpoints for bot integration"
  },
  "item": [
    {
      "name": "Verify User",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-bot-api-key", "value": "{{BOT_API_KEY}}"}
        ],
        "url": "{{BASE_URL}}/api/auth/verify-phone",
        "body": {
          "mode": "raw",
          "raw": "{\"phoneNumber\": \"+1234567890\", \"platform\": \"whatsapp\"}"
        }
      }
    }
  ]
}
```

---

## 🔧 **ENVIRONMENT SETUP**

### **Required Environment Variables**

#### **Bot Service (.env)**
```env
# API Configuration
NEXTJS_API_URL=https://your-app-domain.com
BOT_API_KEY=your-secure-bot-api-key

# WhatsApp Configuration
ULTRAMSG_INSTANCE_ID=your-instance-id
ULTRAMSG_TOKEN=your-ultramsg-token
WHATSAPP_VERIFY_TOKEN=your-verification-token

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-3.5-turbo

# Service Configuration
PORT=5000
NODE_ENV=production
LOG_LEVEL=info

# Health Check
HEALTH_CHECK_INTERVAL=30000
```

#### **Next.js API (.env.local)**
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_secret

# Bot Integration
BOT_API_KEY=your-secure-bot-api-key
ALLOWED_BOT_IPS=127.0.0.1,your-bot-server-ip

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### **Development Setup**

#### **1. Clone and Setup Next.js App**
```bash
git clone https://github.com/your-org/repli-nextjs.git
cd repli-nextjs
npm install
cp .env.example .env.local
# Configure environment variables
npm run dev
```

#### **2. Test API Endpoints**
```bash
# Health check
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -H "x-bot-api-key: test-key" \
  -d '{"phoneNumber": "+1234567890", "platform": "whatsapp"}'
```

#### **3. Setup Bot Service**
```bash
# Create bot service directory
mkdir repli-bot
cd repli-bot
npm init -y
npm install express axios dotenv

# Copy integration examples
# Configure environment variables
# Test connection to Next.js API
```

---

## 📞 **SUPPORT & CONTACT**

### **Technical Support**
- **Documentation**: This guide + API reference
- **Team Chat**: #bot-integration Slack channel
- **Email**: dev-team@repli.com
- **Emergency**: +1-XXX-XXX-XXXX

### **API Status**
- **Status Page**: https://status.repli.com
- **Monitoring**: Real-time API health checks
- **Maintenance**: Scheduled updates notifications

### **Version Updates**
- **Current Version**: 2.0.0
- **Breaking Changes**: Documented in changelog
- **Migration Guide**: Available for major versions
- **Backward Compatibility**: 1 version maintained

---

## 📋 **QUICK REFERENCE**

### **Essential Endpoints**
```
POST /api/auth/verify-phone     # Authenticate user by phone
POST /api/auth/update-usage     # Update message usage
POST /api/bot/conversations     # Log conversation
GET  /api/bot/limits/{userId}   # Check usage limits
```

### **Response Codes**
- `200` - Success
- `400` - Bad Request  
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

### **Rate Limits**
- **Authentication**: 100 requests/minute
- **Usage Updates**: 1000 requests/minute  
- **Conversation Logging**: 500 requests/minute
- **General API**: 500 requests/minute

---

*📅 **Document Version**: 2.0.0*  
*🔄 **Last Updated**: December 19, 2024*  
*👥 **Target Audience**: Bot Development Team*  
*🛠️ **Maintained By**: Repli Platform Team* 