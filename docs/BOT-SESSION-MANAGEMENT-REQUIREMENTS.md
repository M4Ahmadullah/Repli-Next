# Bot Team - Session Management Requirements

## 🎯 Overview
The frontend needs better session management with smart status tracking and automatic cleanup.

## 📋 Requirements

### 1. Session Status Tracking
- **Smart Status Field**: Add a `status` field in Redis that understands if session is active or inactive
- **Status Values**: 
  - `active` - Session is connected and working
  - `inactive` - Session is disconnected or expired
  - `connecting` - Session is in the process of connecting
  - `failed` - Session failed to connect

### 2. Automatic Session Cleanup
- **Inactive Session Detection**: Automatically detect and remove inactive sessions from Redis
- **Session Expiry**: Sessions should expire after a configurable time (e.g., 24 hours)
- **Cleanup Interval**: Run cleanup every hour to remove expired sessions

### 3. Session Clearing Endpoint
- **Endpoint**: `POST /v1/whatsapp/clear-session/{botId}`
- **Functionality**: Clear session from Redis and database
- **Parameters**:
  ```json
  {
    "userId": "string",
    "clearSession": true,
    "clearRedis": true,
    "clearDatabase": true
  }
  ```

### 4. Session Status API
- **Endpoint**: `GET /v1/whatsapp/session-status/{botId}`
- **Response**:
  ```json
  {
    "success": true,
    "status": "active|inactive|connecting|failed",
    "lastSeen": "2025-01-01T00:00:00Z",
    "phoneNumber": "1234567890",
    "displayName": "User Name",
    "sessionId": "session_123"
  }
  ```

### 5. Redis Schema Updates
```redis
# Session data with smart status
HMSET session:{botId}:{userId} 
  status "active"
  lastSeen "2025-01-01T00:00:00Z"
  phoneNumber "1234567890"
  displayName "User Name"
  sessionId "session_123"
  createdAt "2025-01-01T00:00:00Z"
  expiresAt "2025-01-02T00:00:00Z"

# Session status index
SET session:status:{botId}:{userId} "active"
EXPIRE session:status:{botId}:{userId} 86400
```

### 6. Automatic Cleanup Logic
```javascript
// Pseudo-code for cleanup
function cleanupInactiveSessions() {
  const sessions = redis.scan('session:*')
  
  sessions.forEach(session => {
    const lastSeen = session.lastSeen
    const status = session.status
    
    if (isExpired(lastSeen) || status === 'inactive') {
      redis.del(session.key)
      console.log('🗑️ Cleaned up inactive session:', session.key)
    }
  })
}

// Run every hour
setInterval(cleanupInactiveSessions, 3600000)
```

## 🚀 Implementation Priority

### High Priority
1. ✅ Session clearing endpoint (`/v1/whatsapp/clear-session/{botId}`)
2. ✅ Smart status field in Redis
3. ✅ Session status API endpoint

### Medium Priority
1. 🔄 Automatic inactive session detection
2. 🔄 Session expiry configuration
3. 🔄 Cleanup interval implementation

### Low Priority
1. 📊 Session analytics and monitoring
2. 📊 Session health dashboard
3. 📊 Session performance metrics

## 🔧 Technical Notes

### Redis Keys Structure
```
session:{botId}:{userId} - Main session data
session:status:{botId}:{userId} - Status index
session:expiry:{botId}:{userId} - Expiry tracking
```

### Status Transitions
```
connecting → active (on successful connection)
connecting → failed (on connection failure)
active → inactive (on disconnection)
inactive → connecting (on reconnection attempt)
```

### Error Handling
- Graceful handling of Redis connection failures
- Fallback to database for session data
- Logging of all session state changes
- Alerting for session cleanup failures

## 📞 Contact
For questions about these requirements, please contact the frontend team. 