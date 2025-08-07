# 🤖 Q&A Training Flow - Bot Team Implementation Plan

## 📋 **Overview**
The new Q&A training flow consists of 3 stages with AI taking a proactive role in gathering information. This document outlines what the bot team needs to implement.

## 🗂️ **Document Storage Strategy**

### **Recommended: Firebase Storage**
- **Location**: `repli-b4f74.appspot.com/training-docs/{userId}/{botId}/`
- **File naming**: `{timestamp}_{originalName}`
- **Access control**: User-specific folders
- **Cleanup**: Auto-delete after 30 days

### **Alternative: Local Storage**
- **Location**: `/uploads/training-docs/{userId}/{botId}/`
- **Backup**: Daily to cloud storage
- **Cleanup**: Manual or cron job

## 🔧 **Required Backend Endpoints**

### 1. **Document Upload & Processing**
```typescript
POST /api/v1/training/upload-document
{
  "userId": "user_123",
  "botId": "bot_456", 
  "file": File,
  "fileName": "business-plan.pdf"
}

Response:
{
  "success": true,
  "data": {
    "documentId": "doc_789",
    "fileName": "business-plan.pdf",
    "fileSize": 245760,
    "extractedText": "Full text content...",
    "wordCount": 1250,
    "processingTime": 2.3
  }
}
```

**Implementation Tasks:**
- [ ] File upload to Firebase Storage
- [ ] Text extraction (PDF: `pdf-parse`, DOC: `mammoth`)
- [ ] Content validation (min 100 words, max 10,000 words)
- [ ] Store extracted text in Redis (TTL: 30 minutes)
- [ ] Return document ID for reference

### 2. **AI Question Generation**
```typescript
POST /api/v1/training/generate-questions
{
  "userId": "user_123",
  "botId": "bot_456",
  "docExists": true,
  "documentId": "doc_789" // optional
}

Response:
{
  "success": true,
  "data": {
    "questions": [
      "What are your main services?",
      "What makes your business unique?",
      "What are your business hours?",
      "How do customers contact you?",
      "What are your pricing options?",
      "What is your company's mission?",
      "What are your key products?",
      "How do you handle support?"
    ],
    "questionCount": 8,
    "generationTime": 1.2
  }
}
```

**Implementation Tasks:**
- [ ] AI service integration (OpenAI/Gemini/Claude)
- [ ] Document-aware question generation
- [ ] Fallback questions for no document
- [ ] Question quality validation
- [ ] Rate limiting (max 10 questions per request)

### 3. **Answer Storage**
```typescript
POST /api/v1/training/store-answers
{
  "userId": "user_123",
  "botId": "bot_456",
  "answers": [
    {
      "question": "What are your main services?",
      "answer": "We provide web development and digital marketing services..."
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "storedCount": 8,
    "sessionId": "session_abc123"
  }
}
```

**Implementation Tasks:**
- [ ] Store in Redis with session ID
- [ ] Validate answer quality (min 10 characters)
- [ ] Associate with bot training session
- [ ] Prepare for AI training

### 4. **Custom Q&A Pairs**
```typescript
POST /api/v1/training/custom-pairs
{
  "userId": "user_123",
  "botId": "bot_456",
  "pairs": [
    {
      "question": "What is your refund policy?",
      "answer": "We offer 30-day money-back guarantee..."
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "storedCount": 3,
    "sessionId": "session_abc123"
  }
}
```

**Implementation Tasks:**
- [ ] Store custom pairs in Redis
- [ ] Validate question-answer pairs
- [ ] Associate with training session
- [ ] Support CRUD operations

### 5. **AI Training Trigger**
```typescript
POST /api/v1/training/train-ai
{
  "userId": "user_123",
  "botId": "bot_456",
  "sessionId": "session_abc123"
}

Response:
{
  "success": true,
  "data": {
    "trainingId": "train_xyz789",
    "status": "started",
    "estimatedTime": 120
  }
}
```

**Implementation Tasks:**
- [ ] Compile all training data (answers + custom pairs)
- [ ] Trigger AI model fine-tuning
- [ ] Update bot configuration
- [ ] Return training status
- [ ] WebSocket progress updates

## 🧠 **AI Integration Requirements**

### **Question Generation Logic**
```typescript
interface QuestionGenerator {
  // Document-based questions
  generateFromDocument(text: string): string[]
  
  // Generic business questions
  generateGenericQuestions(): string[]
  
  // Quality validation
  validateQuestions(questions: string[]): boolean
}
```

### **Training Data Compilation**
```typescript
interface TrainingCompiler {
  // Combine all training data
  compileTrainingData(sessionId: string): TrainingData
  
  // Format for AI model
  formatForTraining(data: TrainingData): string
  
  // Trigger fine-tuning
  triggerTraining(botId: string, data: string): Promise<string>
}
```

## 📊 **Database Schema Updates**

### **Training Sessions**
```sql
CREATE TABLE training_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  bot_id VARCHAR(50) NOT NULL,
  document_id VARCHAR(50),
  status ENUM('pending', 'in_progress', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  training_data JSON,
  INDEX idx_user_bot (user_id, bot_id)
);
```

### **Training Data**
```sql
CREATE TABLE training_data (
  id VARCHAR(50) PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  type ENUM('answer', 'custom_pair'),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id)
);
```

## 🔄 **Redis Structure**

### **Session Data**
```
training:session:{sessionId} = {
  "userId": "user_123",
  "botId": "bot_456", 
  "documentId": "doc_789",
  "answers": [...],
  "customPairs": [...],
  "status": "pending"
}
```

### **Document Cache**
```
training:doc:{documentId} = {
  "extractedText": "...",
  "wordCount": 1250,
  "processedAt": "2025-01-23T..."
}
```

## 🚀 **Implementation Priority**

### **Phase 1: Core Infrastructure**
1. [ ] Document upload endpoint
2. [ ] Text extraction service
3. [ ] Redis session management
4. [ ] Basic question generation

### **Phase 2: AI Integration**
1. [ ] AI service connection
2. [ ] Question generation logic
3. [ ] Answer storage system
4. [ ] Training trigger

### **Phase 3: Advanced Features**
1. [ ] Custom pairs management
2. [ ] Training progress tracking
3. [ ] WebSocket updates
4. [ ] Error handling & retry logic

## 🔐 **Security Considerations**

### **File Upload Security**
- [ ] File type validation
- [ ] Size limits (300KB max)
- [ ] Virus scanning
- [ ] Content validation

### **Data Privacy**
- [ ] User data isolation
- [ ] Encryption at rest
- [ ] Secure deletion
- [ ] GDPR compliance

### **Rate Limiting**
- [ ] Upload limits per user
- [ ] Question generation limits
- [ ] Training request limits
- [ ] API abuse prevention

## 📈 **Monitoring & Analytics**

### **Metrics to Track**
- [ ] Document upload success rate
- [ ] Question generation quality
- [ ] Training completion rate
- [ ] User engagement time
- [ ] Error rates by endpoint

### **Logging Requirements**
- [ ] Request/response logging
- [ ] Error tracking
- [ ] Performance metrics
- [ ] User activity tracking

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] Document processing
- [ ] Question generation
- [ ] Data storage
- [ ] Training triggers

### **Integration Tests**
- [ ] End-to-end training flow
- [ ] AI service integration
- [ ] Redis operations
- [ ] Error scenarios

### **Load Testing**
- [ ] Concurrent uploads
- [ ] Training queue performance
- [ ] Redis memory usage
- [ ] API response times

## 📝 **API Documentation**

### **Swagger/OpenAPI Spec**
- [ ] Complete endpoint documentation
- [ ] Request/response examples
- [ ] Error codes & messages
- [ ] Authentication requirements

### **Integration Guide**
- [ ] Frontend integration steps
- [ ] WebSocket event types
- [ ] Error handling patterns
- [ ] Best practices

## 🎯 **Success Criteria**

### **Functional Requirements**
- [ ] Users can upload documents successfully
- [ ] AI generates relevant questions
- [ ] Training data is stored correctly
- [ ] AI training completes successfully
- [ ] Bot responds with trained knowledge

### **Performance Requirements**
- [ ] Document processing < 30 seconds
- [ ] Question generation < 10 seconds
- [ ] Training trigger < 5 seconds
- [ ] 99.9% uptime for critical endpoints

### **Quality Requirements**
- [ ] 95% question relevance score
- [ ] 90% training success rate
- [ ] < 1% data loss rate
- [ ] Zero security vulnerabilities

---

## 📞 **Next Steps**

1. **Review this plan** with the bot team
2. **Set up development environment** with required services
3. **Start with Phase 1** implementation
4. **Coordinate with frontend team** for integration
5. **Plan testing and deployment** strategy

**Estimated Timeline**: 2-3 weeks for full implementation
**Team Size**: 2-3 developers recommended
**Priority**: High - Core feature for user experience 