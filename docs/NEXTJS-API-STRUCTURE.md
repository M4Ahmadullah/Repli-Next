# 🚀 Next.js Team API Structure & Responsibilities
**Complete Integration Guide for Multi-Bot WhatsApp Platform**

## 🎯 Overview
As the **Next.js Frontend/Dashboard Team**, we are responsible for creating the **user interface and data collection layer** that allows users to interact with our bot system. We are the "control panel" - the bot system is the "engine".

### Our Mission
- ✅ Build beautiful, responsive user interfaces
- ✅ Collect and validate user inputs  
- ✅ Forward requests to bot system
- ✅ Display real-time data from bot system
- ✅ Handle user authentication and profiles
- ❌ **NOT** handle bot logic, WhatsApp integration, or AI processing

## 🏗️ API Architecture

### Core Principle: Request Forwarding Pattern
```
User Input → Next.js Validation → Bot System Request → UI Update
```

**We DO NOT handle bot logic directly.** We collect, validate, and forward user requests to the bot system.

## 📋 Complete API Endpoints Structure

### 1. Bot Request APIs (`/api/bot-requests/`)
**Purpose**: Collect user requests and forward them to the bot system

| Endpoint | Method | Purpose | Bot System Endpoint |
|----------|--------|---------|-------------------|
| `/api/bot-requests/create` | POST | Create new bot | `POST ${BOT_SYSTEM_URL}/api/bots` |
| `/api/bot-requests/train` | POST | Send training data | `POST ${BOT_SYSTEM_URL}/api/bots/{botId}/training` |
| `/api/bot-requests/connect` | POST | WhatsApp connection | `POST ${BOT_SYSTEM_URL}/api/whatsapp/qr/{botId}` |
| `/api/bot-requests/status` | GET | Get bot status | `GET ${BOT_SYSTEM_URL}/api/bots/{botId}/status` |

#### `POST /api/bot-requests/create`
**Purpose**: Create new bot instances
**Responsibilities**:
- ✅ Validate user input (name, description, personality)
- ✅ Check user's plan limits (free: 1 bot, starter: 3 bots, etc.)
- ✅ Generate unique request ID for tracking
- ✅ Forward request to bot system: `POST ${BOT_SYSTEM_URL}/api/bots`
- ✅ Update user's bot list in Firebase
- ❌ Don't create bot logic or WhatsApp connections

**Request Body**:
```json
{
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "personality": "professional"
}
```

**Response**:
```json
{
  "success": true,
  "bot": {
    "id": "bot_123",
    "name": "Customer Support Bot",
    "status": "creating",
    "whatsappConnected": false
  },
  "requestId": "req_1234567890_abc123"
}
```

#### `POST /api/bot-requests/train`
**Purpose**: Collect training data and send to bot system
**Responsibilities**:
- ✅ Validate Q&A pairs, business info, personality settings
- ✅ Check plan limits (free: 5 Q&A pairs, starter: 25, etc.)
- ✅ Format training data for bot system
- ✅ Forward to bot system: `POST ${BOT_SYSTEM_URL}/api/bots/{botId}/training`
- ✅ Update user's bot training status
- ❌ Don't process documents or create AI responses

**Request Body**:
```json
{
  "botId": "bot_123",
  "businessInfo": {
    "name": "Acme Corp",
    "description": "We sell widgets",
    "industry": "Manufacturing",
    "website": "https://acme.com"
  },
  "qnaPairs": [
    {
      "question": "What are your business hours?",
      "answer": "We're open Monday-Friday 9am-5pm EST"
    }
  ],
  "personality": "professional",
  "autoRespond": true,
  "fallbackMessage": "I'll connect you with a human agent."
}
```

#### `POST /api/bot-requests/connect`
**Purpose**: Handle WhatsApp connection requests
**Responsibilities**:
- ✅ Validate bot ownership
- ✅ Forward QR generation requests to bot system
- ✅ Check connection status from bot system
- ✅ Handle disconnect requests
- ✅ Update user's bot connection status
- ❌ Don't generate QR codes or handle WhatsApp webhooks

**Request Body**:
```json
{
  "botId": "bot_123",
  "action": "generate-qr" // or "check-status" or "disconnect"
}
```

#### `GET /api/bot-requests/status`
**Purpose**: Get real-time bot status from bot system
**Responsibilities**:
- ✅ Query bot system for current status
- ✅ Aggregate analytics from multiple bots
- ✅ Format data for dashboard display
- ✅ Handle bot system unavailability gracefully
- ❌ Don't store or calculate analytics ourselves

### 2. Dashboard Data APIs (`/api/dashboard/`)
**Purpose**: Aggregate and display data from bot system

| Endpoint | Method | Purpose | Bot System Endpoints |
|----------|--------|---------|-------------------|
| `/api/dashboard/stats` | GET | User dashboard stats | Multiple analytics endpoints |
| `/api/dashboard/bots` | GET | User's bot list | `GET ${BOT_SYSTEM_URL}/api/bots/user/{userId}` |
| `/api/dashboard/analytics` | GET | Combined analytics | `GET ${BOT_SYSTEM_URL}/api/analytics/{botId}` |

#### `GET /api/dashboard/stats`
**Purpose**: Aggregate dashboard statistics for user
**Responsibilities**:
- ✅ Fetch analytics from bot system for all user's bots
- ✅ Calculate usage percentages vs plan limits
- ✅ Aggregate totals (messages, response times, etc.)
- ✅ Format data for dashboard components
- ❌ Don't calculate analytics ourselves

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "plan": "starter",
    "planStatus": "active"
  },
  "overview": {
    "totalBots": 2,
    "connectedBots": 1,
    "activeBots": 1,
    "trainingBots": 1
  },
  "analytics": {
    "totalMessages": 1250,
    "todayMessages": 45,
    "weeklyMessages": 320,
    "monthlyMessages": 1100,
    "averageResponseTime": 1200
  },
  "usage": {
    "bots": { "current": 2, "limit": 3, "percentage": 67 },
    "dailyMessages": { "current": 45, "limit": 100, "percentage": 45 }
  }
}
```

### 3. User Management APIs (`/api/users/`)
**Purpose**: Handle user profiles and subscription management

| Endpoint | Method | Purpose | Firebase/Clerk |
|----------|--------|---------|----------------|
| `/api/users/[userId]` | GET | Get user profile | Firebase read |
| `/api/users/[userId]` | PUT | Update user profile | Firebase update |
| `/api/users/[userId]` | DELETE | Delete user account | Firebase delete |

#### `GET /api/users/[userId]`
**Purpose**: Get user profile and subscription info
**Responsibilities**:
- ✅ Return user profile from Firebase
- ✅ Include subscription details and limits
- ✅ Include user's bot list
- ❌ Don't include sensitive bot system data

#### `PUT /api/users/[userId]`
**Purpose**: Update user profile
**Responsibilities**:
- ✅ Validate profile updates
- ✅ Update Firebase user document
- ✅ Sync changes with bot system if needed
- ❌ Don't update bot configurations directly

### 4. Subscription Management APIs (`/api/subscriptions/`)
**Purpose**: Handle user subscription and billing

| Endpoint | Method | Purpose | Integration |
|----------|--------|---------|-------------|
| `/api/subscriptions/[userId]` | GET | Get subscription details | Firebase + Stripe |
| `/api/subscriptions/[userId]` | PUT | Update subscription | Firebase + Stripe |

### 5. Webhook APIs (`/api/webhooks/`)
**Purpose**: Handle external service webhooks

| Endpoint | Method | Purpose | Service |
|----------|--------|---------|---------|
| `/api/webhooks/clerk` | POST | Clerk user events | Clerk webhook |
| `/api/webhooks/stripe` | POST | Stripe billing events | Stripe webhook |

## 🔄 Integration Patterns

### 1. Request Forwarding Pattern
```typescript
// ✅ CORRECT: Collect, validate, forward
async function createBot(userData: CreateBotData) {
  // 1. Validate user input
  const validatedData = validateBotData(userData)
  
  // 2. Check user limits
  const user = await getUserById(userId)
  if (user.bots.length >= planLimits[user.plan]) {
    throw new Error('Bot limit reached')
  }
  
  // 3. Forward to bot system
  const response = await fetch(`${BOT_SYSTEM_URL}/api/bots`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      requestId: generateRequestId(),
      ...validatedData
    })
  })
  
  // 4. Update UI state
  const botResult = await response.json()
  await updateUserBots(userId, botResult.bot)
  
  return botResult
}
```

### 2. Status Monitoring Pattern
```typescript
// ✅ CORRECT: Query bot system, format for UI
async function getBotStatus(botId: string) {
  // 1. Get status from bot system
  const statusResponse = await fetch(`${BOT_SYSTEM_URL}/api/bots/${botId}/status`)
  const analyticsResponse = await fetch(`${BOT_SYSTEM_URL}/api/analytics/${botId}`)
  
  // 2. Format for dashboard
  return {
    botId,
    status: statusResponse.status,
    analytics: analyticsResponse.data,
    lastUpdated: new Date()
  }
}
```

### 3. Error Handling Pattern
```typescript
// ✅ CORRECT: Graceful degradation when bot system unavailable
try {
  const botSystemData = await fetch(`${BOT_SYSTEM_URL}/api/...`)
  return botSystemData
} catch (error) {
  console.error('Bot system unavailable:', error)
  // Return cached data from Firebase
  return getCachedBotData(botId)
}
```

## 🚫 What We DON'T Do

### ❌ Bot Logic Management
```typescript
// ❌ WRONG: Don't implement bot responses
function generateBotResponse(message: string) {
  // This belongs in the bot system!
}

// ❌ WRONG: Don't handle WhatsApp webhooks
app.post('/webhook', (req, res) => {
  // Bot system handles this!
})
```

### ❌ Direct WhatsApp Integration
```typescript
// ❌ WRONG: Don't call UltraMsg directly
const response = await fetch('https://api.ultramsg.com/...') 

// ✅ CORRECT: Forward to bot system
const response = await fetch(`${BOT_SYSTEM_URL}/api/whatsapp/...`)
```

### ❌ Training Data Processing
```typescript
// ❌ WRONG: Don't process documents
function extractTextFromPDF(file: File) {
  // Bot system handles this!
}

// ✅ CORRECT: Forward file to bot system
const formData = new FormData()
formData.append('document', file)
await fetch(`${BOT_SYSTEM_URL}/api/bots/${botId}/documents`, {
  method: 'POST',
  body: formData
})
```

## 🎨 UI Components Integration

### Dashboard Usage
```typescript
// ✅ CORRECT: Use our dashboard stats API
const { data } = await fetch('/api/dashboard/stats')
// Display aggregated data in dashboard components
```

### Bot Creation Wizard
```typescript
// ✅ CORRECT: Collect user input, forward to our API
const botData = {
  name: 'Support Bot',
  description: 'Customer support',
  personality: 'professional'
}

const response = await fetch('/api/bot-requests/create', {
  method: 'POST',
  body: JSON.stringify(botData)
})
```

### Real-time Status Updates
```typescript
// ✅ CORRECT: Poll our status API
setInterval(async () => {
  const status = await fetch(`/api/bot-requests/status?botId=${botId}`)
  updateBotStatus(status.data)
}, 30000) // Every 30 seconds
```

## 🔧 Required Environment Variables

```env
# Bot System Integration (CRITICAL FOR COMMUNICATION)
BOT_SYSTEM_URL=http://localhost:4000
BOT_SYSTEM_API_KEY=your_secure_bot_system_api_key

# Firebase (for user data storage)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe (for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📊 Plan Limits & Validation

### Bot Limits by Plan
```typescript
const BOT_LIMITS = {
  free: { bots: 1, dailyMessages: 10, monthlyMessages: 300, qnaPairs: 5 },
  starter: { bots: 3, dailyMessages: 100, monthlyMessages: 3000, qnaPairs: 25 },
  growth: { bots: 10, dailyMessages: 500, monthlyMessages: 15000, qnaPairs: 100 },
  enterprise: { bots: 50, dailyMessages: 2000, monthlyMessages: 60000, qnaPairs: 500 }
}
```

### Validation Rules
- **Bot Creation**: Check user.bots.length < LIMITS[plan].bots
- **Training Data**: Check qnaPairs.length < LIMITS[plan].qnaPairs  
- **Daily Usage**: Check todayMessages < LIMITS[plan].dailyMessages
- **Monthly Usage**: Check monthlyMessages < LIMITS[plan].monthlyMessages

## 📊 Success Metrics

### ✅ We're Successful When:
- Users can easily create and manage multiple bots
- Training wizard is intuitive and fast
- Dashboard shows real-time bot status and analytics
- All user interactions are smooth and responsive
- Error states are handled gracefully
- Bot system integration is seamless

### 📈 Key Performance Indicators:
- Bot creation completion rate > 90%
- Training wizard abandonment rate < 10%
- Dashboard load time < 2 seconds
- API response time < 500ms
- User satisfaction score > 4.5/5

## 🚀 Deployment Checklist

### Before Deploying:
- [ ] All API endpoints validate user input with Zod schemas
- [ ] Plan limits are enforced correctly before forwarding requests
- [ ] Error handling covers bot system unavailability gracefully
- [ ] User data is properly synced with Firebase
- [ ] Dashboard aggregates data correctly from bot system
- [ ] Bot creation wizard works end-to-end
- [ ] Real-time status updates function properly
- [ ] Clerk authentication is properly configured
- [ ] Environment variables are set correctly
- [ ] Bot system communication is tested

## 🤝 Communication Protocol with Bot System Team

### When We Need Something from Bot System:
1. **New API Endpoints**: Request specific endpoints with expected input/output
2. **Data Format Changes**: Ask for modifications to response structures
3. **Status Updates**: Request real-time status information
4. **Error Handling**: Report integration issues and error scenarios

### What Bot System Can Expect from Us:
1. **Consistent Data Format**: We'll always send data in agreed formats
2. **Proper Authentication**: All requests include valid API keys
3. **Request IDs**: Every request includes unique tracking ID
4. **User Context**: We'll provide user plan, limits, and permissions
5. **Error Reporting**: We'll report integration issues promptly

### API Contract Examples:

#### Bot Creation Request to Bot System:
```json
POST ${BOT_SYSTEM_URL}/api/bots
{
  "userId": "user_123",
  "requestId": "req_1234567890_abc123",
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "personality": "professional",
  "userPlan": "starter",
  "userLimits": {
    "dailyMessages": 100,
    "monthlyMessages": 3000
  }
}
```

#### Expected Bot System Response:
```json
{
  "success": true,
  "botId": "bot_456",
  "status": "creating",
  "estimatedCompletion": "2-3 minutes",
  "webhookUrl": "https://bot-system.com/webhook/bot_456"
}
```

## 🔄 Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │  Next.js APIs   │    │  Bot System     │
│                 │    │                 │    │                 │
│ • Dashboard UI  │───▶│ • Validation    │───▶│ • Bot Logic     │
│ • Bot Creation  │    │ • Plan Limits   │    │ • WhatsApp API  │
│ • Training UI   │    │ • Request       │    │ • AI Processing │
│ • Analytics     │◀───│   Forwarding    │◀───│ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Clerk       │    │    Firebase     │    │   UltraMsg      │
│ Authentication  │    │  User Storage   │    │  WhatsApp API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Complete Project Structure

```
repli-nextjs/
├── 📄 Configuration Files
│   ├── .env.local              # Environment variables (copy from .env.local.example)
│   ├── .gitignore              # Git ignore patterns
│   ├── components.json         # ShadCN UI configuration
│   ├── eslint.config.mjs       # ESLint configuration
│   ├── middleware.ts           # Clerk authentication middleware
│   ├── next.config.ts          # Next.js configuration
│   ├── package.json            # Dependencies and scripts
│   ├── postcss.config.mjs      # PostCSS configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── 📚 Documentation
│   ├── BOT-AUTHENTICATION-INTEGRATION.md    # Bot team integration guide
│   ├── EXPRESS-BOT-CLERK-INTEGRATION.md     # Express bot integration
│   ├── NEXTJS-API-STRUCTURE.md              # This file - API structure
│   ├── README.md                            # Project overview
│   ├── REPLI-BOT-DOCUMENTATION.md           # Bot documentation
│   └── SETUP-GUIDE.md                       # Setup instructions
│
├── 🌐 Public Assets
│   └── public/
│       ├── file.svg
│       ├── globe.svg
│       ├── next.svg
│       ├── vercel.svg
│       └── window.svg
│
└── 💻 Source Code
    └── src/
        ├── 📱 App Router
        │   └── app/
        │       ├── (auth)/                    # 🔐 Authentication routes
        │       │   ├── layout.tsx             # Auth layout with pixel background
        │       │   ├── sign-in/[[...sign-in]]/page.tsx
        │       │   └── sign-up/[[...sign-up]]/page.tsx
        │       │
        │       ├── (dashboard)/               # 🛡️ Protected dashboard routes
        │       │   └── dashboard/page.tsx     # Multi-bot dashboard
        │       │
        │       ├── 🔌 API Routes
        │       │   ├── bot-requests/          # 🎯 CORE: Forward to bot system
        │       │   │   ├── connect/route.ts   # WhatsApp connection requests
        │       │   │   ├── create/route.ts    # Bot creation requests
        │       │   │   ├── status/route.ts    # Bot status monitoring
        │       │   │   └── train/route.ts     # Training data forwarding
        │       │   │
        │       │   ├── dashboard/             # 📊 Dashboard data aggregation
        │       │   │   └── stats/route.ts     # Aggregate analytics from bot system
        │       │   │
        │       │   ├── subscriptions/         # 💳 Subscription management
        │       │   │   └── [userId]/route.ts  # User subscription CRUD
        │       │   │
        │       │   ├── users/                 # 👤 User profile management
        │       │   │   └── [userId]/route.ts  # User profile CRUD
        │       │   │
        │       │   └── webhooks/              # 🔗 External service webhooks
        │       │       └── clerk/route.ts     # Clerk user sync webhook
        │       │
        │       ├── 📄 Pages
        │       │   ├── layout.tsx             # Root layout with providers
        │       │   ├── page.tsx               # Landing page
        │       │   ├── pricing/page.tsx       # Pricing page
        │       │   ├── not-found.tsx          # 404 page
        │       │   ├── globals.css            # Global styles
        │       │   └── favicon.ico            # Favicon
        │
        ├── 🧩 Components
        │   └── components/
        │       ├── dashboard/                 # 📊 Dashboard-specific components
        │       │   ├── bot-creation-wizard.tsx    # Multi-step bot creation
        │       │   ├── bot-selector.tsx           # Bot switching interface
        │       │   ├── bot-status-monitor.tsx     # Real-time status display
        │       │   └── whatsapp-setup.tsx         # WhatsApp connection UI
        │       │
        │       ├── layout/                    # 🏗️ Layout components
        │       │   ├── conditional-layout.tsx     # Conditional header/footer
        │       │   ├── footer.tsx                 # Site footer
        │       │   └── header.tsx                 # Navigation with auth
        │       │
        │       ├── providers/                 # 🔧 Context providers
        │       │   ├── clerk-provider.tsx         # Clerk auth with theming
        │       │   ├── theme-provider.tsx         # Dark/light mode
        │       │   └── providers.tsx              # Combined providers
        │       │
        │       └── ui/                        # 🎨 Reusable UI components (ShadCN)
        │           ├── avatar.tsx, badge.tsx, button.tsx
        │           ├── card.tsx, checkbox.tsx, dialog.tsx
        │           ├── dropdown-menu.tsx, form.tsx, input.tsx
        │           ├── label.tsx, select.tsx, sheet.tsx
        │           ├── table.tsx, tabs.tsx, textarea.tsx
        │           └── theme-toggle.tsx
        │
        └── 📚 Library
            └── lib/
                ├── api/                       # 🌐 API client utilities
                │   └── client.ts              # HTTP client wrapper
                │
                ├── firebase/                  # 🔥 Firebase configuration
                │   ├── admin.ts               # Server-side Firebase admin
                │   └── config.ts              # Client-side Firebase config
                │
                ├── services/                  # 🔧 Business logic services
                │   └── user.service.ts        # User data management (Firebase)
                │
                ├── types/                     # 📝 TypeScript definitions
                │   └── user.ts                # User, Bot, Subscription interfaces
                │
                └── utils.ts                   # 🛠️ Utility functions
```

## 🎯 Key Implementation Details

### ✅ Implemented & Working
- **Multi-Bot Architecture**: Users can create and manage multiple bots
- **Clerk Authentication**: Complete auth flow with custom styling
- **Plan Limit Enforcement**: Validates bot creation against subscription limits
- **Request Forwarding**: All bot operations forward to bot system APIs
- **Real-time Dashboard**: Aggregates data from multiple bots
- **Error Handling**: Graceful degradation when bot system unavailable
- **TypeScript**: Full type safety with comprehensive interfaces
- **Responsive UI**: Mobile-friendly dashboard and landing page

### 🔄 Request Flow Examples
```
1. Bot Creation:
   User Dashboard → /api/bot-requests/create → Bot System → Firebase Update

2. Training Data:
   Training Form → /api/bot-requests/train → Bot System → Status Update

3. WhatsApp Connection:
   Setup Component → /api/bot-requests/connect → Bot System → QR Code Display

4. Dashboard Stats:
   Dashboard Load → /api/dashboard/stats → Bot System Analytics → Aggregated Display
```

## 🎯 Success Criteria Summary

### ✅ Next.js Team Delivers:
- **Beautiful Multi-Bot Dashboard**: Users can create, manage, and monitor multiple bots
- **Intuitive Bot Creation Wizard**: Step-by-step bot setup with training data collection
- **Real-time Status Monitoring**: Live updates from bot system displayed in UI
- **Comprehensive Analytics Dashboard**: Aggregated data from all user's bots
- **Seamless Authentication**: Clerk integration with proper user management
- **Plan Limit Enforcement**: Proper validation before forwarding to bot system
- **Error Handling**: Graceful degradation when bot system is unavailable

### 🤖 Bot System Team Delivers:
- **Bot Logic & AI Processing**: Handle all bot intelligence and responses
- **WhatsApp Integration**: Manage UltraMsg API and message routing
- **Training Data Processing**: Convert documents and Q&A into AI knowledge
- **Analytics Generation**: Calculate metrics and usage statistics
- **Multi-Bot Architecture**: Support multiple bots per user
- **Webhook Processing**: Handle incoming WhatsApp messages
- **QR Code Generation**: Manage WhatsApp connection process

Remember: **We build the "control panel" - the bot system IS the actual engine!** 🎮

## 🚀 Current Status & Next Steps

### ✅ Completed (Ready for Bot Team Integration)
1. **API Structure**: All bot-requests endpoints implemented and tested
2. **Authentication**: Clerk integration with custom styling complete
3. **Multi-Bot Dashboard**: Fully functional with real-time status monitoring
4. **Plan Limits**: Enforced across all bot creation and training endpoints
5. **Error Handling**: Graceful degradation when bot system unavailable
6. **TypeScript**: Complete type definitions for all interfaces
7. **Documentation**: Comprehensive API guide for bot team integration

### 🔄 Ready for Bot Team
- **Environment Variables**: Set `BOT_SYSTEM_URL` and `BOT_SYSTEM_API_KEY`
- **API Endpoints**: All `/api/bot-requests/*` routes ready to forward requests
- **Data Formats**: Consistent request/response formats documented above
- **Authentication**: User context included in all bot system requests
- **Plan Validation**: User limits checked before forwarding requests

### 🎯 Integration Checklist for Bot Team
- [ ] Set up bot system API endpoints matching our documented structure
- [ ] Implement webhook callbacks for status updates
- [ ] Test request/response formats with our API endpoints
- [ ] Configure WhatsApp Business API integration
- [ ] Set up analytics data collection for dashboard aggregation

### 📞 Support & Communication
- **Issues**: Report integration issues via GitHub issues
- **Questions**: Contact Next.js team for API clarifications
- **Changes**: Any API format changes require coordination between teams

---

**Last Updated**: December 2024
**Version**: 2.1.0 - Final Implementation
**Team**: Next.js Frontend/Dashboard Team
**Status**: ✅ Ready for Bot Team Integration 