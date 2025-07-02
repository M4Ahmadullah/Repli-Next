# 🤖 Repli Bot Backend Service - Complete Documentation

**Version:** 1.0.0  
**Technology:** Node.js + Express + TypeScript  
**Purpose:** WhatsApp AI Bot Backend for Repli SaaS Platform  
**AI Provider:** OpenAI ChatGPT-3.5  

---

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [API Endpoints](#api-endpoints)
6. [Services & Components](#services--components)
7. [Environment Configuration](#environment-configuration)
8. [Database Schema](#database-schema)
9. [WhatsApp Bot Workflow](#whatsapp-bot-workflow)
10. [Deployment Guide](#deployment-guide)
11. [Cost Analysis](#cost-analysis)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 **Project Overview**

Repli Bot is a standalone backend service that powers AI-driven WhatsApp bots for small businesses. It acts as a webhook receiver, processes incoming messages through ChatGPT, and sends intelligent responses back to customers.

### **Key Responsibilities**
- ✅ Receive WhatsApp messages via UltraMsg webhook
- ✅ Identify business/project from Firebase database
- ✅ Validate usage quotas based on subscription plans
- ✅ Generate AI responses using OpenAI ChatGPT-3.5
- ✅ Send responses back through WhatsApp API
- ✅ Log all conversations and track usage

### **Integration Points**
- **Frontend:** Connects to `repli-nextjs` dashboard via shared Firebase
- **WhatsApp:** UltraMsg API for message sending/receiving
- **AI:** OpenAI ChatGPT-3.5 for response generation
- **Database:** Firebase Firestore for data persistence

---

## 🏗️ **Architecture & Design**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Repli Bot     │    │   Firebase      │
│   (UltraMsg)    │◄──►│   Backend       │◄──►│   Firestore     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   OpenAI        │
                       │   ChatGPT-3.5   │
                       └─────────────────┘
```

### **Message Flow**
1. **Customer** sends WhatsApp message
2. **UltraMsg** forwards to bot webhook
3. **Bot** looks up business in Firebase
4. **Bot** checks usage quotas
5. **Bot** sends message to ChatGPT
6. **ChatGPT** generates response
7. **Bot** sends response via WhatsApp
8. **Bot** logs conversation to Firebase

---

## 📁 **Project Structure**

```
repli-bot/
├── 📄 .env                        # Environment variables
├── 📄 .env.example               # Environment template
├── 📄 .eslintrc.json             # ESLint configuration
├── 📄 .gitignore                 # Git ignore patterns
├── 📄 Dockerfile                 # Docker containerization
├── 📄 README.md                  # Project documentation
├── 📄 docker-compose.yml         # Docker Compose setup
├── 📄 ecosystem.config.js        # PM2 production config
├── 📄 package.json               # Dependencies & scripts
├── 📄 tsconfig.json              # TypeScript configuration
└── 📂 src/
    ├── 📂 config/
    │   ├── 📄 firebase.ts         # Firebase Admin SDK
    │   └── 📄 logger.ts           # Winston logging
    ├── 📂 handlers/
    │   ├── 📄 healthCheck.ts      # Health monitoring
    │   └── 📄 whatsappWebhook.ts  # WhatsApp processing
    ├── 📄 index.ts                # Express server
    └── 📂 services/
        ├── 📄 aiService.ts        # ChatGPT integration
        ├── 📄 firebaseService.ts  # Database operations
        └── 📄 whatsappService.ts  # WhatsApp API
```

---

## ⭐ **Core Features**

### **🤖 AI Integration**
- **OpenAI ChatGPT-3.5** for intelligent responses
- Business-specific personality customization
- WhatsApp-optimized responses (under 160 chars)
- Token usage tracking for cost monitoring
- Automatic fallback responses for errors

### **📱 WhatsApp Integration**
- Complete UltraMsg API integration
- Webhook verification and message processing
- Media support (images, documents)
- Batch messaging with rate limiting
- Delivery status tracking

### **🔥 Firebase Integration**
- Firebase Admin SDK for server-side operations
- User/business configuration management
- Real-time usage quota tracking
- Complete conversation logging
- Plan-based access control

### **🛡️ Security & Reliability**
- TypeScript with strict type checking
- Comprehensive error handling
- Rate limiting and request validation
- Structured logging with Winston
- Health monitoring endpoints

---

## 🔗 **API Endpoints**

### **Health & Monitoring**
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-06-25T10:30:00Z",
  "uptime": 3600,
  "service": "Repli Bot Service",
  "version": "1.0.0",
  "environment": "production",
  "ai_mode": "openai_chatgpt",
  "firebase_status": "connected"
}
```

### **Root Endpoint**
```http
GET /
```
**Response:**
```json
{
  "service": "Repli Bot Service",
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2024-06-25T10:30:00Z"
}
```

### **WhatsApp Webhook**
```http
GET /webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
POST /webhook
```

**Webhook Payload Example:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "from": "1234567890",
      "to": "0987654321",
      "body": "Hello, I need help!",
      "type": "text",
      "timestamp": 1640995200
    }
  ]
}
```

---

## 🔧 **Services & Components**

### **1. AI Service (`aiService.ts`)**
```typescript
interface BusinessSettings {
  businessName?: string;
  businessDescription?: string;
  botPersonality?: string;
  customInstructions?: string;
}

// Main methods:
generateResponse(message: string, settings?: BusinessSettings): Promise<string>
testConnection(): Promise<{success: boolean, model: string, error?: string}>
estimateTokens(text: string): number
```

### **2. Firebase Service (`firebaseService.ts`)**
```typescript
// Key methods:
getUserConfigByPhone(phoneNumber: string): Promise<UserConfig | null>
checkUsageLimit(userId: string): Promise<boolean>
incrementUsageCount(userId: string): Promise<void>
logMessage(messageData: MessageLog): Promise<void>
getUserStats(userId: string): Promise<UsageStats>
```

### **3. WhatsApp Service (`whatsappService.ts`)**
```typescript
// Key methods:
sendMessage(to: string, message: string, options?: SendMessageOptions): Promise<SendResult>
sendImage(to: string, imageUrl: string, caption?: string): Promise<SendResult>
getInstanceStatus(): Promise<StatusResult>
sendBatchMessages(messages: BatchMessage[]): Promise<BatchResult[]>
```

---

## ⚙️ **Environment Configuration**

### **Required Variables**
```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# OpenAI ChatGPT (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Firebase Admin SDK (Required)
FIREBASE_PROJECT_ID=repli-b4f74
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@repli-b4f74.iam.gserviceaccount.com

# WhatsApp Integration (Required for production)
ULTRAMSG_INSTANCE_ID=your-instance-id
ULTRAMSG_TOKEN=your-ultramsg-token
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token
```

### **Optional Variables**
```bash
# Security & Rate Limiting
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=60

# Usage Limits per Plan
FREE_PLAN_DAILY_LIMIT=10
STARTER_PLAN_DAILY_LIMIT=100
GROWTH_PLAN_DAILY_LIMIT=500
ENTERPRISE_PLAN_DAILY_LIMIT=2000

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
ENABLE_CONSOLE_LOGS=true
ENABLE_DEBUG_LOGS=false
```

---

## 🗄️ **Database Schema (Firebase Firestore)**

### **Collections Structure**

#### **`users` Collection**
```javascript
{
  userId: "user_123",
  email: "business@example.com",
  businessName: "Coffee Shop Co",
  settings: {
    whatsappPhoneNumber: "1234567890",
    businessName: "Coffee Shop Co",
    businessDescription: "Local coffee shop specializing in organic coffee",
    botPersonality: "friendly and enthusiastic",
    customInstructions: "Always mention our daily specials",
    autoRespond: true,
    businessHours: {
      enabled: true,
      timezone: "America/New_York",
      schedule: {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true }
      }
    }
  },
  subscription: {
    plan: "starter",
    status: "active",
    currentPeriodStart: "2024-01-01T00:00:00Z",
    currentPeriodEnd: "2024-02-01T00:00:00Z"
  },
  createdAt: "2024-01-01T00:00:00Z"
}
```

#### **`messages` Collection**
```javascript
{
  messageId: "msg_123",
  userId: "user_123",
  from: "customer_phone",
  to: "business_phone",
  userMessage: "Hello, what are your hours?",
  botResponse: "Hi! We're open Monday-Friday 9am-5pm. How can I help you today?",
  timestamp: "2024-01-01T10:30:00Z",
  status: "delivered",
  createdAt: "2024-01-01T10:30:00Z"
}
```

#### **`usage` Collection**
```javascript
{
  documentId: "user_123_2024-01-01",
  userId: "user_123",
  date: "2024-01-01",
  count: 15,
  lastUpdated: "2024-01-01T15:30:00Z"
}
```

---

## 🔄 **WhatsApp Bot Workflow**

### **Complete Message Processing Flow**

```mermaid
graph TD
    A[WhatsApp Message] --> B[UltraMsg Webhook]
    B --> C[Bot Receives POST /webhook]
    C --> D[Validate Webhook]
    D --> E[Extract Message Data]
    E --> F[Lookup User in Firebase]
    F --> G{User Found?}
    G -->|No| H[Log & Ignore]
    G -->|Yes| I[Check Usage Quota]
    I --> J{Quota Available?}
    J -->|No| K[Send Limit Message]
    J -->|Yes| L[Generate ChatGPT Response]
    L --> M[Send via WhatsApp]
    M --> N[Log Conversation]
    N --> O[Increment Usage]
    O --> P[Complete]
```

### **Detailed Steps**

1. **Webhook Verification** (GET request)
   ```typescript
   if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
     return challenge; // Verify webhook
   }
   ```

2. **Message Processing** (POST request)
   ```typescript
   const payload = req.body;
   for (const message of payload.messages) {
     await processMessage(message);
   }
   ```

3. **User Lookup**
   ```typescript
   const userConfig = await firebaseService.getUserConfigByPhone(message.to);
   if (!userConfig) {
     return; // No business found for this number
   }
   ```

4. **Quota Check**
   ```typescript
   const canSendMessage = await firebaseService.checkUsageLimit(userConfig.userId);
   if (!canSendMessage) {
     await whatsappService.sendMessage(message.from, "Daily limit reached");
     return;
   }
   ```

5. **AI Response Generation**
   ```typescript
   const aiResponse = await aiService.generateResponse(message.body, {
     businessName: userConfig.settings.businessName,
     businessDescription: userConfig.settings.businessDescription,
     botPersonality: userConfig.settings.botPersonality,
     customInstructions: userConfig.settings.customInstructions,
   });
   ```

6. **Send Response**
   ```typescript
   await whatsappService.sendMessage(message.from, aiResponse);
   ```

7. **Logging & Tracking**
   ```typescript
   await firebaseService.logMessage({
     messageId: message.id,
     userId: userConfig.userId,
     from: message.from,
     to: message.to,
     userMessage: message.body,
     botResponse: aiResponse,
     timestamp: new Date(),
     status: 'sent'
   });
   
   await firebaseService.incrementUsageCount(userConfig.userId);
   ```

---

## 🚀 **Deployment Guide**

### **Local Development**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start development server
npm run dev

# 4. Test endpoints
curl http://localhost:5000/health
```

### **Production Deployment**

#### **Option 1: PM2 (Recommended)**
```bash
# 1. Build application
npm run build

# 2. Install PM2
npm install -g pm2

# 3. Start with PM2
pm2 start ecosystem.config.js --env production

# 4. Monitor
pm2 status
pm2 logs repli-bot
```

#### **Option 2: Docker**
```bash
# 1. Build image
docker build -t repli-bot .

# 2. Run container
docker run -d \
  --name repli-bot \
  -p 5000:5000 \
  --env-file .env \
  repli-bot

# 3. Or use Docker Compose
docker-compose up -d
```

#### **Option 3: Cloud Platforms**

**Railway:**
```bash
railway login
railway new
railway add
railway deploy
```

**Render:**
- Connect GitHub repository
- Set environment variables
- Deploy from dashboard

**DigitalOcean App Platform:**
- Connect repository
- Configure build settings
- Set environment variables

### **Environment Variables for Production**
```bash
# Production overrides
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
```

---

## 💰 **Cost Analysis**

### **OpenAI ChatGPT Costs**
- **Model:** GPT-3.5-turbo
- **Input:** $0.50 / 1M tokens
- **Output:** $1.50 / 1M tokens
- **Average:** ~100 tokens per conversation
- **Cost per message:** ~$0.0002 (extremely low!)

### **Monthly Cost Estimates**

| Plan       | Daily Limit | Monthly Messages | OpenAI Cost | Total Cost* |
|------------|-------------|------------------|-------------|-------------|
| Free       | 10          | 300              | $0.06       | $0.06       |
| Starter    | 100         | 3,000            | $0.60       | $0.60       |
| Growth     | 500         | 15,000           | $3.00       | $3.00       |
| Enterprise | 2,000       | 60,000           | $12.00      | $12.00      |

*Not including hosting, WhatsApp API, and Firebase costs

### **Additional Costs**
- **Hosting:** $5-20/month (Railway, Render)
- **WhatsApp API:** $0.005-0.01 per message
- **Firebase:** Free for small usage, ~$25/month for growth

---

## 🛠️ **Development Commands**

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint (currently disabled)
npm run format          # Format code with Prettier
npm run clean           # Clean build artifacts

# Testing
curl http://localhost:5000/health  # Health check
curl http://localhost:5000/        # Root endpoint
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Firebase Connection Errors**
```
Error: Missing Firebase configuration
```
**Solution:**
- Verify `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- Check Firebase service account permissions
- Ensure Firestore is enabled

#### **2. OpenAI API Errors**
```
Error: OpenAI API key not configured
```
**Solution:**
- Add valid `OPENAI_API_KEY` to environment
- Check API key has credits available
- Verify network connectivity to api.openai.com

#### **3. WhatsApp Webhook Errors**
```
Error: Webhook verification failed
```
**Solution:**
- Verify `WHATSAPP_VERIFY_TOKEN` matches UltraMsg setting
- Check webhook URL is publicly accessible
- Ensure HTTPS in production

#### **4. Build Errors**
```
TypeScript compilation errors
```
**Solution:**
- Run `npm install` to ensure dependencies
- Check TypeScript configuration
- Verify all imports are correct

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=debug
export ENABLE_DEBUG_LOGS=true
npm start
```

### **Health Monitoring**
- Monitor `/health` endpoint
- Check PM2 logs: `pm2 logs repli-bot`
- Monitor Firebase usage in console
- Track OpenAI usage in dashboard

---

## 📞 **Support & Maintenance**

### **Monitoring Checklist**
- [ ] `/health` endpoint responds correctly
- [ ] Firebase connection status
- [ ] OpenAI API quota and usage
- [ ] WhatsApp webhook deliverability
- [ ] Log files rotation and cleanup
- [ ] Memory and CPU usage

### **Regular Maintenance**
- Update dependencies monthly
- Monitor API quotas and limits
- Review and clean old logs
- Backup Firebase data
- Update documentation

### **Scaling Considerations**
- Use Redis for session management
- Implement message queuing for high volume
- Add multiple WhatsApp number support
- Load balancing with multiple instances

---

**Last Updated:** June 25, 2024  
**Version:** 1.0.0  
**Author:** Repli Development Team 