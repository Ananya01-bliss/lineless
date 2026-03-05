# Lineless Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Start MongoDB
```bash
# Extract MongoDB Compass from:
D:\MEA_Stack\compass.zip

# Run MongoDBCompass.exe
# Connect to: mongodb://localhost:27017
```

### 2. Start Backend Server
```bash
cd "d:/M.tech at RVCE/Notes/1st sem/DSA_Lab/LineLessv1/backend"
npm start
```

### 3. Test API
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Lineless API is running"}
```

## 📡 API Endpoints Cheat Sheet

### Authentication
```bash
# Register
POST /api/auth/register
Body: { "name": "...", "email": "...", "password": "..." }

# Login
POST /api/auth/login
Body: { "email": "...", "password": "..." }
```

### Organizations
```bash
# Create Organization
POST /api/organizations
Headers: Authorization: Bearer <token>
Body: { "name": "...", "type": "hospital" }

# Get Organizations
GET /api/organizations
Headers: Authorization: Bearer <token>
```

### Services
```bash
# Create Service
POST /api/services
Body: {
  "name": "...",
  "organizationId": "...",
  "counters": [{"name": "Counter 1", "status": "active"}]
}

# Get Services
GET /api/services/organization/:orgId
```

### Queue Operations
```bash
# Join Queue (Customer)
POST /api/tokens/join
Body: { "serviceId": "...", "priority": "normal" }

# Call Next Token (Staff)
POST /api/tokens/call-next
Body: { "serviceId": "..." }

# Mark Served (Staff)
POST /api/tokens/:tokenId/serve

# Get Queue Status
GET /api/tokens/service/:serviceId/queue
```

## 🧮 DSA Components Quick Reference

### FIFO Queue
```javascript
const queue = new FIFOQueue();
queue.enqueue(token);           // O(1)
queue.dequeue();                // O(1)
queue.peek();                   // O(1)
queue.size();                   // O(1)
```

### Min-Heap (Counter Load Balancing)
```javascript
const heap = new MinHeap();
heap.insert(counter);           // O(log n)
heap.extractMin();              // O(log n)
heap.peek();                    // O(1)
heap.update(id, newData);       // O(log n)
```

### Sliding Window (Wait Time Prediction)
```javascript
const window = new SlidingWindow(20);
window.add(serviceTime);        // O(1)
window.getAverage();            // O(1)
window.predictWaitTime(pos);    // O(1)
```

### Deque (No-Show Management)
```javascript
const deque = new Deque();
deque.addFront(token);          // O(1)
deque.addBack(token);           // O(1)
deque.removeFront();            // O(1)
deque.removeBack();             // O(1)
```

### Queue Manager (Orchestrator)
```javascript
const qm = new QueueManager(serviceId, counters);
qm.addToken(tokenData);         // Add to queue
qm.assignNextToken();           // Call next with load balancing
qm.markServed(tokenId);         // Complete service
qm.skipToken(tokenId);          // Handle no-show
qm.getQueueStatus();            // Get analytics
```

## 🔌 WebSocket Events

### Client → Server
```javascript
socket.emit('join-service', serviceId);
```

### Server → Client
```javascript
socket.on('queue-updated', (data) => {
  // Queue status changed
});

socket.on('token-called', (data) => {
  // Token called to counter
});
```

## 📊 Queue Flow Diagram

```
Customer → Scan QR → Join Queue → FIFO Queue
                                       ↓
                              Priority Check
                                       ↓
Staff → Call Next ← Min-Heap ← Assign Counter
           ↓
    Token Called
           ↓
    Customer Served → Sliding Window → Update Stats
```

## 🎯 Priority System

```
Priority Queue (checked first)
├── Senior Citizens (60+)
├── Expectant Mothers
└── Persons with Disability

Normal Queue (checked second)
└── Regular customers

Rule: FIFO within each priority level
```

## 📈 Analytics Metrics

```javascript
{
  totalTokens: 150,
  avgWaitTime: 240,        // seconds
  maxWaitTime: 480,
  avgServiceTime: 180,
  counterUtilization: {
    "counter1": 45,        // tokens served
    "counter2": 38
  },
  hourlyDistribution: [...], // 24-hour array
  peakHours: [10, 11, 14]
}
```

## 🔐 Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lineless
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:4200
```

## 🐛 Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
Solution: Start MongoDB Compass and ensure server is running
```

### JWT Token Expired
```
Error: jwt expired
Solution: Login again to get new token
```

### Queue Not Updating
```
Issue: WebSocket not connected
Solution: Check Socket.IO connection in browser console
```

## 📁 Project Structure

```
backend/
├── server.js              # Main server
├── dsa/                   # Data structures
│   ├── FIFOQueue.js
│   ├── MinHeap.js
│   ├── SlidingWindow.js
│   ├── Deque.js
│   └── QueueManager.js
├── models/                # Database models
├── routes/                # API routes
└── middleware/            # Auth middleware
```

## 🧪 Test Scenario

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# 2. Create organization (use token from step 1)
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hospital","type":"hospital"}'

# 3. Create service (use orgId from step 2)
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"General","organizationId":"<ORG_ID>","counters":[{"name":"C1","status":"active"}]}'

# 4. Join queue (use serviceId from step 3)
curl -X POST http://localhost:3000/api/tokens/join \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"<SERVICE_ID>","priority":"normal"}'

# 5. Call next token
curl -X POST http://localhost:3000/api/tokens/call-next \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"<SERVICE_ID>"}'
```

## 📚 Documentation Files

- `README.md` - Project overview
- `ARCHITECTURE.md` - System design
- `IMPLEMENTATION_PLAN.md` - Development roadmap
- `TESTING_GUIDE.md` - API testing
- `PROJECT_SUMMARY.md` - Achievements

## 🎓 Key Concepts

**Load Balancing:** Min-Heap ensures tokens distributed to least-busy counters

**Fairness:** FIFO guarantees first-come-first-served within priority

**Prediction:** Sliding Window adapts to actual service times

**Flexibility:** Deque handles edge cases (no-shows, recalls)

**Speed:** HashMap provides O(1) token lookups

## 💡 Pro Tips

1. **Always check priority queue first** - Prevents starvation
2. **Update sliding window after each service** - Better predictions
3. **Use WebSocket for real-time** - Don't poll the API
4. **Index MongoDB properly** - Fast queries on serviceId + status
5. **Handle no-shows gracefully** - Move to deque, don't delete

---

**Status:** Backend Complete ✅
**Server:** http://localhost:3000
**Database:** mongodb://localhost:27017/lineless

*Keep this card handy for quick reference!*
