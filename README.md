# Lineless - Virtual Queue Management System

**Tagline:** "Skip the Line, Not the Service"

## 🚀 Project Overview

Lineless is a revolutionary QR-based virtual queue management system that replaces physical queues with intelligent, real-time digital queue management. Built with the MEAN stack (MongoDB, Express, Angular, Node.js) and powered by advanced data structures and algorithms.

### Key Features

- ✅ **QR-Based Virtual Queue** - Customers scan and join instantly
- ✅ **Real-Time Queue Tracking** - Live position updates via WebSocket
- ✅ **Intelligent Load Balancing** - Min-Heap based counter assignment
- ✅ **Priority Queue Management** - Separate lanes for seniors, expectant mothers, PWD
- ✅ **Predictive Wait Times** - Sliding window algorithm for accurate predictions
- ✅ **Multi-Service Support** - Manage multiple services from one dashboard
- ✅ **Public Display Integration** - Live TV display for waiting areas
- ✅ **Advanced Analytics** - Data-driven insights on performance

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (real-time communication)
- JWT Authentication
- QR Code generation

**Frontend:**
- Angular 19+
- RxJS for reactive programming
- Socket.IO client
- SCSS for styling
- Progressive Web App (PWA)

### Data Structures & Algorithms

The system is powered by five core DSA components:

1. **FIFO Queue** - Maintains arrival order fairness
   - Time Complexity: O(1) enqueue/dequeue
   - Purpose: Fair queue ordering

2. **Min-Heap** - Counter load balancing
   - Time Complexity: O(log n) insert/extract
   - Purpose: Assign tokens to least-loaded counters

3. **Sliding Window** - Wait time prediction
   - Time Complexity: O(1) average calculation
   - Purpose: Dynamic wait time estimation

4. **Deque** - No-show management
   - Time Complexity: O(1) add/remove from both ends
   - Purpose: Handle skipped tokens and recalls

5. **HashMap** - Token state management
   - Time Complexity: O(1) lookups
   - Purpose: Fast token status retrieval

## 📁 Project Structure

```
LineLessv1/
├── backend/
│   ├── dsa/
│   │   ├── FIFOQueue.js          # FIFO queue implementation
│   │   ├── MinHeap.js            # Min-heap for load balancing
│   │   ├── SlidingWindow.js      # Wait time prediction
│   │   ├── Deque.js              # No-show management
│   │   └── QueueManager.js       # Orchestrates all DSA components
│   ├── models/
│   │   ├── User.js               # User authentication model
│   │   ├── Organization.js       # Organization/business model
│   │   ├── Service.js            # Service configuration model
│   │   └── Token.js              # Queue token model
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── organizations.js      # Organization CRUD
│   │   ├── services.js           # Service management
│   │   ├── tokens.js             # Queue operations
│   │   └── analytics.js          # Analytics endpoints
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── server.js                 # Express server + Socket.IO
│   ├── .env                      # Environment variables
│   └── package.json
│
└── frontend/                     # Angular application (to be created)
    └── (Angular project structure)
```

## 🚦 Getting Started

### Prerequisites

- Node.js v24+ (already installed)
- MongoDB (local or Atlas)
- MongoDB Compass (already downloaded to D:\MEA_Stack)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd "d:/M.tech at RVCE/Notes/1st sem/DSA_Lab/LineLessv1/backend"
```

2. **Install dependencies** (already done):
```bash
npm install
```

3. **Configure environment variables:**
Edit `.env` file with your settings:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lineless
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:4200
```

4. **Start MongoDB:**
- Extract MongoDB Compass from `D:\MEA_Stack\compass.zip`
- Run `MongoDBCompass.exe`
- Connect to `mongodb://localhost:27017`

5. **Start the server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:3000`

### Frontend Setup (Next Steps)

The Angular frontend will be created with:
- Landing page with hero section
- Authentication pages (login/signup)
- Organization management dashboard
- Service configuration
- Customer queue joining interface
- Staff counter panel
- Public display page
- Analytics dashboard

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Organizations
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Services
- `GET /api/services/organization/:orgId` - Get organization services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Tokens (Queue Operations)
- `POST /api/tokens/join` - Join queue
- `GET /api/tokens/:tokenId/status` - Get token status
- `POST /api/tokens/call-next` - Call next token
- `POST /api/tokens/:tokenId/serve` - Mark as served
- `POST /api/tokens/:tokenId/skip` - Skip token (no-show)
- `GET /api/tokens/service/:serviceId/queue` - Get queue status

### Analytics
- `GET /api/analytics/service/:serviceId` - Get service analytics

## 🔌 WebSocket Events

### Client → Server
- `join-organization` - Join organization room
- `join-service` - Join service room

### Server → Client
- `queue-updated` - Queue status changed
- `token-called` - Token called to counter

## 🎨 Design System

### Color Palette
- **Primary Gradient:** #6366F1 → #3B82F6
- **Accent:** #06B6D4 → #14B8A6
- **Success:** #10B981 → #22C55E
- **Warning:** #F59E0B → #F97316
- **Error:** #F43F5E → #EF4444

### Key Design Principles
- Glassmorphism effects
- Gradient-based theming
- Smooth animations
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA)

## 📊 Queue Management Flow

1. **Customer Joins:**
   - Scans QR code → Redirected to join page
   - Selects priority (if applicable)
   - Receives token number and position
   - Token added to FIFO queue (or priority queue)

2. **Token Assignment:**
   - Staff clicks "Call Next"
   - Min-Heap selects least-loaded counter
   - Priority queue checked first
   - Token assigned and customer notified

3. **Service Completion:**
   - Staff marks token as served
   - Service time recorded in Sliding Window
   - Counter load decremented
   - Analytics updated

4. **Wait Time Prediction:**
   - Sliding Window calculates average service time
   - Position in queue × avg time / active counters
   - Real-time updates as queue moves

## 🧪 Testing the System

### Test Scenario 1: Basic Queue Flow
1. Create organization (Hospital)
2. Add service (General Consultation) with 2 counters
3. Generate QR code
4. Join queue 5 times (simulate 5 customers)
5. Call next token → Assigned to Counter 1
6. Call next token → Assigned to Counter 2 (load balancing)
7. Mark tokens as served
8. Check analytics

### Test Scenario 2: Priority Queue
1. Join with normal priority (3 customers)
2. Join with priority (senior citizen)
3. Call next → Priority customer called first
4. Verify fairness within each priority level

### Test Scenario 3: No-Show Handling
1. Call next token
2. Skip token (no-show)
3. Token moved to skipped deque
4. Recall token if customer arrives

## 🔐 Security Considerations

- JWT tokens for authentication
- Password hashing with bcrypt
- Input validation on all routes
- CORS configuration
- Rate limiting (to be added)
- HTTPS in production

## 📈 Performance Optimizations

- In-memory queue managers for fast operations
- MongoDB indexing on frequently queried fields
- Socket.IO rooms for targeted broadcasts
- Lazy loading in Angular
- Code splitting
- Service worker caching (PWA)

## 🚀 Deployment

### Backend Deployment
- Deploy to Heroku, AWS, or DigitalOcean
- Use MongoDB Atlas for database
- Set environment variables
- Enable HTTPS

### Frontend Deployment
- Build for production: `ng build --prod`
- Deploy to Netlify, Vercel, or Firebase
- Configure environment URLs

## 📝 Next Steps

1. ✅ Backend API complete
2. ⏳ Create Angular frontend
3. ⏳ Implement landing page
4. ⏳ Build authentication UI
5. ⏳ Create dashboard
6. ⏳ Implement customer interface
7. ⏳ Build public display
8. ⏳ Add analytics charts
9. ⏳ PWA configuration
10. ⏳ Testing & deployment

## 🤝 Contributing

This is an academic project for M.Tech DSA Lab at RVCE.

## 📄 License

MIT License

## 👨‍💻 Author

Created for DSA Lab coursework at RVCE

---

**Status:** Backend Complete ✅ | Frontend In Progress ⏳
