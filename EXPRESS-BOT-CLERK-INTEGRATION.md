# 🔐 EXPRESS WHATSAPP BOT - CLERK AUTHENTICATION INTEGRATION

## 📋 **INTEGRATION OVERVIEW**

This guide outlines how to integrate **Clerk Authentication** from the **Next.js Repli Platform** with your **Express WhatsApp Bot** to provide unified user management and authentication across both platforms.

### **🎯 Integration Goals**
- **Unified Authentication**: Single source of truth for user authentication
- **Real-time User Sync**: Automatic synchronization between Clerk and Firebase
- **Secure API Communication**: Protected endpoints with Clerk token verification
- **Seamless User Experience**: Connected web dashboard and WhatsApp bot
- **Subscription Management**: Plan limits synchronized between platforms

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **📡 Authentication Flow**

```
Next.js App (Clerk) ←→ Shared Firebase ←→ Express Bot
       ↓                    ↓              ↓
   Web Users  ←→  User Profiles  ←→  WhatsApp Users
       ↓                    ↓              ↓
   Dashboard  ←→   Analytics   ←→   Bot Usage
```

### **🔧 Tech Stack Integration**

#### **Next.js Platform (Frontend)**
- **Authentication**: Clerk.dev
- **Database**: Firebase Firestore (shared)
- **API**: Next.js API routes with Clerk middleware

#### **Express Bot (Backend)**
- **Authentication**: Clerk token verification
- **Database**: Firebase Firestore (shared)
- **API**: Express.js with Clerk verification middleware

---

## 🚀 **EXPRESS BOT SETUP**

### **📦 Required Dependencies**

```bash
npm install @clerk/clerk-sdk-node
npm install express cors helmet
npm install firebase-admin
npm install dotenv
```

### **🔐 Environment Variables**

```env
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Firebase Configuration (Shared with Next.js)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Express Server
PORT=3001
NODE_ENV=production

# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=your-verify-token
ULTRAMSG_INSTANCE_ID=your-instance-id
ULTRAMSG_TOKEN=your-ultramsg-token

# Next.js Platform URLs
NEXTJS_BASE_URL=https://your-app-domain.com
ADMIN_API_KEY=your-secure-admin-key
```

---

## 🔧 **IMPLEMENTATION**

### **1. Clerk SDK Configuration**

```javascript
// src/config/clerk.js
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const clerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
};

// Middleware for protecting routes
const requireAuth = ClerkExpressRequireAuth(clerkConfig);

// Middleware for optional auth (user context if available)
const optionalAuth = (req, res, next) => {
  try {
    requireAuth(req, res, next);
  } catch (error) {
    // Continue without auth if token is invalid/missing
    req.auth = null;
    next();
  }
};

module.exports = { requireAuth, optionalAuth, clerkConfig };
```

### **2. Firebase Admin Configuration**

```javascript
// src/config/firebase.js
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };
```

### **3. User Service with Clerk Integration**

```javascript
// src/services/userService.js
const { db } = require('../config/firebase');
const { clerkClient } = require('@clerk/clerk-sdk-node');

class UserService {
  
  // Get user by Clerk ID
  async getUserByClerkId(clerkId) {
    try {
      const userDoc = await db.collection('users').doc(clerkId).get();
      
      if (!userDoc.exists) {
        // User doesn't exist in Firestore, create from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkId);
        return await this.createUserFromClerk(clerkUser);
      }
      
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user by Clerk ID:', error);
      throw error;
    }
  }
  
  // Create user from Clerk data
  async createUserFromClerk(clerkUser) {
    try {
      const userData = {
        id: clerkUser.id,
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        image: clerkUser.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        subscription: {
          id: `sub_${clerkUser.id}`,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          dailyLimit: 10,
          monthlyLimit: 300
        },
        
        settings: {
          whatsappConnected: false,
          whatsappPhoneNumber: null,
          whatsappBusinessAccountId: null,
          whatsappPhoneNumberId: null,
          webhookConfigured: false,
          businessName: null,
          businessDescription: null,
          businessIndustry: null,
          businessWebsite: null,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          botPersonality: 'professional',
          customInstructions: '',
          autoRespond: true,
          businessHours: {
            enabled: false,
            timezone: 'UTC',
            schedule: {
              monday: { start: '09:00', end: '17:00', enabled: true },
              tuesday: { start: '09:00', end: '17:00', enabled: true },
              wednesday: { start: '09:00', end: '17:00', enabled: true },
              thursday: { start: '09:00', end: '17:00', enabled: true },
              friday: { start: '09:00', end: '17:00', enabled: true },
              saturday: { start: '09:00', end: '17:00', enabled: false },
              sunday: { start: '09:00', end: '17:00', enabled: false }
            }
          },
          trainingDataEnabled: false,
          customQnaPairs: []
        },
        
        botStatus: {
          isActive: false,
          lastActivity: null,
          health: 'unknown',
          errorMessage: null,
          stats: {
            todayMessages: 0,
            totalMessages: 0,
            profileCompletions: 0,
            successRate: 0
          }
        }
      };
      
      await db.collection('users').doc(clerkUser.id).set(userData);
      console.log(`✅ Created user from Clerk: ${clerkUser.id}`);
      
      return userData;
    } catch (error) {
      console.error('Error creating user from Clerk:', error);
      throw error;
    }
  }
  
  // Update user context for bot
  async updateUserContext(userId, contextData) {
    try {
      const updateData = {
        ...contextData,
        updatedAt: new Date()
      };
      
      await db.collection('users').doc(userId).update(updateData);
      console.log(`✅ Updated user context: ${userId}`);
      
      return await this.getUserByClerkId(userId);
    } catch (error) {
      console.error('Error updating user context:', error);
      throw error;
    }
  }
  
  // Get user context for bot operations
  async getBotUserContext(userId) {
    try {
      const user = await this.getUserByClerkId(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        userId: user.id,
        phoneNumber: user.settings.whatsappPhoneNumber,
        settings: {
          businessName: user.settings.businessName,
          businessDescription: user.settings.businessDescription,
          botPersonality: user.settings.botPersonality,
          customInstructions: user.settings.customInstructions,
          autoRespond: user.settings.autoRespond,
          businessHours: user.settings.businessHours
        },
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          dailyLimit: user.subscription.dailyLimit
        }
      };
    } catch (error) {
      console.error('Error getting bot user context:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
```

### **4. Authentication Middleware**

```javascript
// src/middleware/auth.js
const { requireAuth, optionalAuth } = require('../config/clerk');
const userService = require('../services/userService');

// Middleware to verify Clerk token and load user
const verifyClerkUser = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Load user from Firestore
    const user = await userService.getUserByClerkId(req.auth.userId);
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware for admin API calls from Next.js
const verifyAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Invalid admin key' });
  }
  
  next();
};

module.exports = { 
  requireAuth, 
  optionalAuth, 
  verifyClerkUser, 
  verifyAdminKey 
};
```

### **5. Protected API Routes**

```javascript
// src/routes/user.js
const express = require('express');
const router = express.Router();
const { requireAuth, verifyClerkUser } = require('../middleware/auth');
const userService = require('../services/userService');

// Get current user profile
router.get('/profile', requireAuth, verifyClerkUser, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user settings
router.put('/settings', requireAuth, verifyClerkUser, async (req, res) => {
  try {
    const { settings } = req.body;
    
    const updatedUser = await userService.updateUserContext(req.user.id, {
      'settings': { ...req.user.settings, ...settings }
    });
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get bot context
router.get('/bot-context', requireAuth, verifyClerkUser, async (req, res) => {
  try {
    const context = await userService.getBotUserContext(req.user.id);
    
    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Get bot context error:', error);
    res.status(500).json({ error: 'Failed to get bot context' });
  }
});

module.exports = router;
```

### **6. Admin API Routes (for Next.js integration)**

```javascript
// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { verifyAdminKey } = require('../middleware/auth');
const userService = require('../services/userService');

// Get user status for dashboard
router.get('/user/:userId/status', verifyAdminKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserByClerkId(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      status: user.botStatus,
      lastActivity: user.botStatus.lastActivity,
      stats: user.botStatus.stats,
      profileComplete: !!(user.settings.businessName && user.settings.whatsappPhoneNumber)
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Refresh user context
router.post('/refresh-user-context', verifyAdminKey, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Force reload user from Clerk and update Firebase
    const clerkUser = await clerkClient.users.getUser(userId);
    const updatedUser = await userService.createUserFromClerk(clerkUser);
    
    res.json({
      success: true,
      message: 'User context refreshed',
      user: updatedUser
    });
  } catch (error) {
    console.error('Refresh user context error:', error);
    res.status(500).json({ error: 'Failed to refresh user context' });
  }
});

// Get analytics for dashboard
router.get('/analytics/user/:userId', verifyAdminKey, async (req, res) => {
  try {
    const { userId } = req.params;
    const { dateRange = '7d' } = req.query;
    
    // Get user analytics from Firebase
    const user = await userService.getUserByClerkId(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate analytics based on stored data
    const analytics = {
      stats: user.botStatus.stats,
      usage: {
        todayMessages: user.botStatus.stats.todayMessages,
        dailyLimit: user.subscription.dailyLimit,
        usagePercentage: (user.botStatus.stats.todayMessages / user.subscription.dailyLimit) * 100
      },
      performance: {
        avgResponseTime: 1200, // ms - would be calculated from actual data
        successRate: user.botStatus.stats.successRate,
        satisfactionScore: 4.2 // would be calculated from user feedback
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;
```

### **7. WhatsApp Webhook with User Context**

```javascript
// src/routes/webhook.js
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// WhatsApp webhook handler
router.post('/whatsapp', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !messages.length) {
      return res.status(200).send('OK');
    }
    
    for (const message of messages) {
      const phoneNumber = message.from;
      
      // Find user by phone number
      const userQuery = await db.collection('users')
        .where('settings.whatsappPhoneNumber', '==', phoneNumber)
        .limit(1)
        .get();
      
      if (userQuery.empty) {
        console.log(`No user found for phone number: ${phoneNumber}`);
        continue;
      }
      
      const userDoc = userQuery.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };
      
      // Get bot context for this user
      const context = await userService.getBotUserContext(user.id);
      
      // Check subscription limits
      if (context.subscription.status !== 'active') {
        console.log(`User ${user.id} has inactive subscription`);
        continue;
      }
      
      if (user.botStatus.stats.todayMessages >= context.subscription.dailyLimit) {
        console.log(`User ${user.id} has reached daily limit`);
        // Send limit reached message
        continue;
      }
      
      // Process message with user context
      await processWhatsAppMessage(message, context);
      
      // Update usage stats
      await userService.updateUserContext(user.id, {
        'botStatus.stats.todayMessages': user.botStatus.stats.todayMessages + 1,
        'botStatus.stats.totalMessages': user.botStatus.stats.totalMessages + 1,
        'botStatus.lastActivity': new Date(),
        'botStatus.health': 'healthy'
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function processWhatsAppMessage(message, userContext) {
  // Your existing WhatsApp message processing logic here
  // Now with access to user context including:
  // - userContext.settings.businessName
  // - userContext.settings.botPersonality
  // - userContext.settings.customInstructions
  // - userContext.subscription.plan
  
  console.log(`Processing message for user ${userContext.userId} with ${userContext.settings.botPersonality} personality`);
}

module.exports = router;
```

### **8. Express App Configuration**

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.NEXTJS_BASE_URL,
    'http://localhost:3000',
    'https://your-production-domain.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/webhook', webhookRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Express Bot Server running on port ${PORT}`);
  console.log(`🔐 Clerk integration enabled`);
  console.log(`🔥 Firebase connected to ${process.env.FIREBASE_PROJECT_ID}`);
});

module.exports = app;
```

---

## 🔄 **NEXT.JS INTEGRATION POINTS**

### **API Calls from Next.js to Express Bot**

```javascript
// Next.js utility: src/lib/api/bot-client.ts
class BotApiClient {
  private baseUrl: string;
  private adminKey: string;

  constructor() {
    this.baseUrl = process.env.BOT_BASE_URL || 'http://localhost:3001';
    this.adminKey = process.env.ADMIN_API_KEY || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'x-admin-key': this.adminKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserStatus(userId: string) {
    return this.request(`/admin/user/${userId}/status`);
  }

  async refreshUserContext(userId: string) {
    return this.request('/admin/refresh-user-context', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getUserAnalytics(userId: string, dateRange = '7d') {
    return this.request(`/admin/analytics/user/${userId}?dateRange=${dateRange}`);
  }
}

export const botApi = new BotApiClient();
```

### **Real-time Sync with Clerk Webhooks**

```javascript
// Next.js API route: src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { UserService } from '@/lib/services/user.service';
import { botApi } from '@/lib/api/bot-client';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook ${id} with type ${eventType}`);

  const userService = UserService.getInstance();

  try {
    switch (eventType) {
      case 'user.created':
        await userService.createUser({
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address,
          name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim(),
          image: evt.data.image_url,
        });
        
        // Notify Express bot of new user
        await botApi.refreshUserContext(evt.data.id);
        break;

      case 'user.updated':
        await userService.updateUser(evt.data.id, {
          name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim(),
          image: evt.data.image_url,
        });
        
        // Sync changes to Express bot
        await botApi.refreshUserContext(evt.data.id);
        break;

      case 'user.deleted':
        await userService.deleteUser(evt.data.id);
        break;
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
```

---

## 🧪 **TESTING & VALIDATION**

### **Testing Checklist**

- [ ] Clerk token verification works in Express
- [ ] User creation syncs between platforms
- [ ] WhatsApp messages associate with correct users
- [ ] Subscription limits are enforced
- [ ] Dashboard shows real-time bot status
- [ ] User settings changes reflect in bot behavior
- [ ] Analytics data flows correctly

### **Test API Endpoints**

```bash
# Test health check
curl http://localhost:3001/health

# Test user profile (requires Clerk token)
curl -H "Authorization: Bearer <clerk-token>" \
     http://localhost:3001/api/user/profile

# Test admin endpoint (requires admin key)
curl -H "x-admin-key: your-admin-key" \
     http://localhost:3001/api/admin/user/user_123/status
```

---

## 🚀 **DEPLOYMENT**

### **Environment Setup**

1. **Shared Firebase Project**: Both Next.js and Express use same Firebase project
2. **Clerk Configuration**: Same Clerk app for both platforms
3. **Network Security**: Express bot accessible from Next.js platform
4. **SSL Certificates**: HTTPS required for Clerk webhooks

### **Docker Configuration**

```dockerfile
# Dockerfile for Express Bot
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/app.js"]
```

---

## 📋 **SECURITY CONSIDERATIONS**

### **🔐 Security Best Practices**

1. **API Key Rotation**: Regularly rotate admin API keys
2. **Token Validation**: Always verify Clerk tokens server-side
3. **Rate Limiting**: Implement rate limiting on all endpoints
4. **Input Validation**: Validate all user inputs
5. **Error Handling**: Don't expose sensitive information in errors
6. **CORS Configuration**: Restrict origins to known domains
7. **Webhook Verification**: Always verify webhook signatures

### **🛡️ Data Protection**

- All user data encrypted in transit and at rest
- Minimal data exposure in API responses
- Audit logging for all user data access
- Regular security reviews and updates

---

*📅 Last Updated: December 2024*  
*🎯 Integration Status: Ready for Implementation*  
*🔧 Compatibility: Express.js 4+, Clerk SDK v4+*  
*📊 Maintainer: Repli Platform Team* 