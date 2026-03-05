# 🗄️ HOW TO VIEW YOUR DATA IN MONGODB

## 📊 **3 WAYS TO SEE YOUR DATA**

---

## **METHOD 1: MongoDB Compass (Recommended - GUI)**

### **Step 1: Open MongoDB Compass**
1. Press **Windows Key**
2. Type **"MongoDB Compass"**
3. Click to open

### **Step 2: Connect to Database**
1. You should see connection string:
   ```
   mongodb://localhost:27017
   ```
2. Click **"Connect"**

### **Step 3: View Your Database**
1. On the left sidebar, you'll see databases:
   - `admin`
   - `config`
   - `local`
   - **`lineless`** ← YOUR DATABASE!

2. Click on **`lineless`**

### **Step 4: View Collections**
You'll see collections (tables):
- **`users`** - Your user accounts
- **`organizations`** - Your organizations
- **`services`** - Queue services
- **`tokens`** - Queue tokens

### **Step 5: View Data**
1. Click on **`users`** collection
2. You'll see all registered users with:
   - `_id` - Unique ID
   - `name` - User's name
   - `email` - User's email
   - `password` - Hashed password
   - `role` - User role
   - `createdAt` - Registration date
   - `updatedAt` - Last update

**Example:**
```json
{
  "_id": "65f8a1b2c3d4e5f6g7h8i9j0",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$hashed_password_here",
  "role": "user",
  "createdAt": "2026-02-07T03:00:00.000Z",
  "updatedAt": "2026-02-07T03:00:00.000Z"
}
```

### **Step 6: View Organizations**
1. Click on **`organizations`** collection
2. You'll see all organizations you created:
   - `_id` - Unique ID
   - `name` - Organization name
   - `description` - Description
   - `address` - Address
   - `contactEmail` - Email
   - `contactPhone` - Phone
   - `isActive` - Active status
   - `createdAt` - Creation date

### **Step 7: Search & Filter**
- Use the **Filter** box at the top
- Example: `{ "email": "john@example.com" }`
- Click **"Find"**

---

## **METHOD 2: MongoDB Shell (Command Line)**

### **Step 1: Open MongoDB Shell**

**Option A: If mongosh is in PATH:**
```powershell
mongosh
```

**Option B: Navigate to MongoDB bin folder:**
```powershell
cd "C:\Program Files\MongoDB\Server\8.0\bin"
.\mongosh.exe
```

### **Step 2: Switch to Your Database**
```javascript
use lineless
```

Output:
```
switched to db lineless
```

### **Step 3: View Collections**
```javascript
show collections
```

Output:
```
organizations
services
tokens
users
```

### **Step 4: View All Users**
```javascript
db.users.find().pretty()
```

Output:
```json
{
  "_id": ObjectId("65f8a1b2c3d4e5f6g7h8i9j0"),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$hashed...",
  "role": "user",
  "createdAt": ISODate("2026-02-07T03:00:00.000Z"),
  "updatedAt": ISODate("2026-02-07T03:00:00.000Z")
}
```

### **Step 5: View All Organizations**
```javascript
db.organizations.find().pretty()
```

### **Step 6: Count Documents**
```javascript
db.users.countDocuments()
db.organizations.countDocuments()
```

### **Step 7: Find Specific User**
```javascript
db.users.findOne({ email: "john@example.com" })
```

### **Step 8: View Latest Entries**
```javascript
// Latest 5 users
db.users.find().sort({ createdAt: -1 }).limit(5).pretty()

// Latest 5 organizations
db.organizations.find().sort({ createdAt: -1 }).limit(5).pretty()
```

---

## **METHOD 3: Using PowerShell/CMD**

### **Quick View Commands:**

**View all users:**
```powershell
mongosh --eval "use lineless; db.users.find().pretty()"
```

**Count users:**
```powershell
mongosh --eval "use lineless; db.users.countDocuments()"
```

**View all organizations:**
```powershell
mongosh --eval "use lineless; db.organizations.find().pretty()"
```

---

## 🎯 **WHAT DATA YOU'LL SEE**

### **After Signup:**
**In `users` collection:**
```json
{
  "_id": ObjectId("..."),
  "name": "Your Name",
  "email": "you@example.com",
  "password": "$2a$10$hashed_password",
  "role": "user",
  "createdAt": ISODate("2026-02-07T..."),
  "updatedAt": ISODate("2026-02-07T...")
}
```

### **After Creating Organization:**
**In `organizations` collection:**
```json
{
  "_id": ObjectId("..."),
  "name": "My First Organization",
  "description": "A test organization",
  "address": "123 Main St",
  "contactEmail": "org@example.com",
  "contactPhone": "+1234567890",
  "isActive": true,
  "createdAt": ISODate("2026-02-07T..."),
  "updatedAt": ISODate("2026-02-07T...")
}
```

### **After Joining Queue:**
**In `tokens` collection:**
```json
{
  "_id": ObjectId("..."),
  "serviceId": ObjectId("..."),
  "organizationId": ObjectId("..."),
  "tokenNumber": "GI001",
  "status": "waiting",
  "priority": "normal",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "joinedAt": ISODate("2026-02-07T..."),
  "position": 1,
  "estimatedWaitTime": 5
}
```

---

## 🔍 **USEFUL MONGODB COMPASS FEATURES**

### **1. Visual Query Builder**
- Click **"Filter"** button
- Build queries visually
- No need to write JSON!

### **2. Export Data**
- Click **"Export Collection"**
- Choose format: JSON or CSV
- Save your data!

### **3. Import Data**
- Click **"Import Data"**
- Upload JSON or CSV
- Bulk insert data!

### **4. Indexes**
- Click **"Indexes"** tab
- See database indexes
- Create new indexes

### **5. Schema Analysis**
- Click **"Schema"** tab
- See field types
- View data distribution

### **6. Aggregation Pipeline**
- Click **"Aggregations"** tab
- Build complex queries
- Analyze data

---

## 📊 **REAL-TIME DATA VIEWING**

### **Watch Data Change in Real-Time:**

1. **Open MongoDB Compass**
2. **Connect to database**
3. **Open `users` collection**
4. **Keep it open**
5. **In your browser, signup**
6. **In Compass, click "Refresh" button** (top right)
7. **See new user appear!** 🎉

### **Auto-Refresh:**
- Click **"Refresh"** button
- Or press **F5**
- See latest data!

---

## 🎨 **MONGODB COMPASS INTERFACE**

```
┌─────────────────────────────────────────────────┐
│ MongoDB Compass                          [_][□][X]│
├─────────────────────────────────────────────────┤
│ Databases:                                      │
│  ├─ admin                                       │
│  ├─ config                                      │
│  ├─ local                                       │
│  └─ lineless ← YOUR DATABASE                   │
│      ├─ users ← Click here                     │
│      ├─ organizations                          │
│      ├─ services                               │
│      └─ tokens                                 │
│                                                 │
│ [Documents] [Schema] [Indexes] [Validation]    │
│                                                 │
│ Filter: { }                          [Find]    │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ {                                        │   │
│ │   "_id": "65f8a1b2...",                 │   │
│ │   "name": "John Doe",                   │   │
│ │   "email": "john@example.com",          │   │
│ │   "role": "user"                        │   │
│ │ }                                        │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Showing 1-10 of 10 documents        [Refresh]  │
└─────────────────────────────────────────────────┘
```

---

## 🧪 **TEST DATA FLOW**

### **Complete Test:**

1. **Open MongoDB Compass**
   - Connect to `mongodb://localhost:27017`
   - Open `lineless` database
   - Open `users` collection
   - Note: Currently empty (or has existing users)

2. **In Browser (http://localhost:4200):**
   - Go to signup page
   - Fill form:
     - Name: Test User
     - Email: test@example.com
     - Password: Test@123
   - Click "Create Account"

3. **Back to MongoDB Compass:**
   - Click **"Refresh"** button (top right)
   - ✅ See new user appear!
   - Click on the document to expand
   - See all fields

4. **Create Organization:**
   - In browser, go to Organizations
   - Click "+ Create Organization"
   - Fill form and submit

5. **Back to MongoDB Compass:**
   - Click on `organizations` collection
   - Click **"Refresh"**
   - ✅ See new organization!

---

## 💡 **PRO TIPS**

### **Compass Tips:**
1. **Double-click** a document to edit it
2. **Right-click** for more options
3. **Use filters** to find specific data
4. **Export** data for backup
5. **Clone** documents for testing

### **Shell Tips:**
1. Use `.pretty()` for formatted output
2. Use `.limit(n)` to limit results
3. Use `.sort()` to order results
4. Use `.count()` to count documents
5. Press **Tab** for autocomplete

---

## 🔐 **SECURITY NOTE**

**What You'll See:**
- ✅ User emails (visible)
- ✅ User names (visible)
- ✅ Passwords (HASHED - secure!)
- ✅ JWT tokens (in localStorage, not DB)

**Passwords are hashed:**
```
Original: Test@123
Stored:   $2a$10$N9qo8uLOickgx2ZMRZoMye...
```

**This is secure!** ✅

---

## 📱 **QUICK ACCESS GUIDE**

### **To View Users:**
```
MongoDB Compass → lineless → users → Refresh
```

### **To View Organizations:**
```
MongoDB Compass → lineless → organizations → Refresh
```

### **To View Tokens:**
```
MongoDB Compass → lineless → tokens → Refresh
```

### **To View Services:**
```
MongoDB Compass → lineless → services → Refresh
```

---

## 🎉 **YOU'RE READY!**

**Open MongoDB Compass now and see your data!**

**Every time you:**
- ✅ Signup → New user in `users`
- ✅ Create org → New doc in `organizations`
- ✅ Join queue → New token in `tokens`
- ✅ Create service → New doc in `services`

**All visible in real-time in MongoDB Compass!** 🎊

---

## 🚀 **NEXT STEPS:**

1. **Open MongoDB Compass**
2. **Connect to database**
3. **Explore collections**
4. **Create data in browser**
5. **Refresh Compass**
6. **See data appear!**
7. **Be amazed!** ✨

---

**YOUR DATA IS WAITING TO BE EXPLORED!** 🗄️

**Open MongoDB Compass and see the magic!** 🎨
