# Backend API Testing Guide

## Prerequisites
- MongoDB running on localhost:27017
- Backend server running on localhost:3000

## Test Sequence

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{
  "status": "OK",
  "message": "Lineless API is running"
}
```

### 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "admin",
    "isVerified": false
  }
}
```

Save the token for subsequent requests.

### 3. Create Organization
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "City Hospital",
    "type": "hospital",
    "description": "Main city hospital"
  }'
```

Save the organization ID.

### 4. Create Service
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "General Consultation",
    "organizationId": "YOUR_ORG_ID",
    "description": "General medical consultation",
    "counters": [
      {"name": "Counter 1", "status": "active"},
      {"name": "Counter 2", "status": "active"}
    ],
    "tokenPrefix": "GC"
  }'
```

Save the service ID.

### 5. Join Queue (Customer)
```bash
curl -X POST http://localhost:3000/api/tokens/join \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "YOUR_SERVICE_ID",
    "priority": "normal"
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "...",
      "number": "GC001",
      "position": 1,
      "estimatedWaitTime": 180,
      "priority": "normal",
      "status": "waiting"
    },
    "customerId": "..."
  }
}
```

### 6. Join Queue (Priority Customer)
```bash
curl -X POST http://localhost:3000/api/tokens/join \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "YOUR_SERVICE_ID",
    "priority": "priority",
    "priorityReason": "senior"
  }'
```

### 7. Get Queue Status
```bash
curl http://localhost:3000/api/tokens/service/YOUR_SERVICE_ID/queue
```

### 8. Call Next Token (Staff)
```bash
curl -X POST http://localhost:3000/api/tokens/call-next \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "YOUR_SERVICE_ID"
  }'
```

Expected: Priority token called first!

### 9. Mark Token as Served
```bash
curl -X POST http://localhost:3000/api/tokens/TOKEN_ID/serve \
  -H "Content-Type: application/json"
```

### 10. Get Analytics
```bash
curl http://localhost:3000/api/analytics/service/YOUR_SERVICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing DSA Components

### Test Load Balancing
1. Join queue 5 times
2. Call next 3 times
3. Verify tokens distributed across counters
4. Counter 1 should have 2 tokens, Counter 2 should have 1

### Test Priority Queue
1. Join with normal priority (3 times)
2. Join with priority (1 time)
3. Call next
4. Verify priority token called first

### Test Wait Time Prediction
1. Join queue
2. Note estimated wait time
3. Mark some tokens as served
4. Join queue again
5. Verify wait time updated based on actual service times

### Test No-Show Handling
1. Call next token
2. Skip token (no-show)
3. Verify token moved to skipped list
4. Recall token if needed

## WebSocket Testing

Use a WebSocket client or browser console:

```javascript
const socket = io('http://localhost:3000');

// Join service room
socket.emit('join-service', 'YOUR_SERVICE_ID');

// Listen for queue updates
socket.on('queue-updated', (data) => {
  console.log('Queue updated:', data);
});

// Listen for token calls
socket.on('token-called', (data) => {
  console.log('Token called:', data);
});
```

## Postman Collection

Import this into Postman for easier testing:

1. Create new collection "Lineless API"
2. Add environment variables:
   - `base_url`: http://localhost:3000
   - `token`: (set after login)
   - `org_id`: (set after creating org)
   - `service_id`: (set after creating service)

3. Add all endpoints from above

## Expected Behavior

✅ **Load Balancing:** Tokens distributed evenly across counters
✅ **Priority Queue:** Priority tokens always called before normal
✅ **Wait Time:** Predictions improve as more tokens are served
✅ **Real-time:** WebSocket events fired on queue changes
✅ **Analytics:** Accurate statistics on wait times and utilization

## Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in .env

**JWT Error:**
- Token expired (default 7 days)
- Re-login to get new token

**Queue Not Updating:**
- Check WebSocket connection
- Verify service ID is correct

**No Tokens in Queue:**
- Ensure tokens were created with correct service ID
- Check token status (should be 'waiting')
