# 🚀 MONGODB INSTALLATION & TESTING GUIDE

## 📋 **STEP-BY-STEP INSTALLATION**

### **Option A: MongoDB Community Server (Recommended for Local Development)**

#### **Step 1: Download MongoDB**

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version:** Latest (7.0 or higher)
   - **Platform:** Windows
   - **Package:** MSI

3. Click **Download**

#### **Step 2: Install MongoDB**

1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. **IMPORTANT:** Check these options:
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - ✅ Install MongoDB Compass (GUI tool)

4. Click **Next** and **Install**
5. Wait for installation to complete

#### **Step 3: Verify Installation**

Open PowerShell and run:
```powershell
mongod --version
```

You should see:
```
db version v7.0.x
```

#### **Step 4: Start MongoDB Service**

MongoDB should start automatically. To verify:
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it:
Start-Service MongoDB
```

#### **Step 5: Test Connection with MongoDB Compass**

1. Open **MongoDB Compass** (installed with MongoDB)
2. Connection string should be pre-filled:
   ```
   mongodb://localhost:27017
   ```
3. Click **Connect**
4. ✅ You should see databases: `admin`, `config`, `local`

---

### **Option B: MongoDB Atlas (Cloud - Free Tier)**

#### **Step 1: Create Account**

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Verify your email

#### **Step 2: Create Free Cluster**

1. Click **Build a Database**
2. Choose **M0 FREE** tier
3. Select cloud provider and region (choose closest to you)
4. Cluster name: `Lineless`
5. Click **Create**
6. Wait 3-5 minutes for cluster creation

#### **Step 3: Create Database User**

1. Go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Authentication Method: **Password**
4. Username: `lineless_user`
5. Password: Generate or create strong password
6. **SAVE THIS PASSWORD!**
7. Database User Privileges: **Read and write to any database**
8. Click **Add User**

#### **Step 4: Whitelist Your IP**

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
4. Click **Confirm**

#### **Step 5: Get Connection String**

1. Go to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string:
   ```
   mongodb+srv://lineless_user:<password>@lineless.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password

---

## 🔧 **CONFIGURE YOUR BACKEND**

### **For Local MongoDB (Option A):**

Your backend `.env` file should already have:
```env
MONGODB_URI=mongodb://localhost:27017/lineless
```

✅ No changes needed!

### **For MongoDB Atlas (Option B):**

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://lineless_user:YOUR_PASSWORD@lineless.xxxxx.mongodb.net/lineless?retryWrites=true&w=majority
```

Replace with your actual connection string!

---

## 🚀 **START YOUR BACKEND**

### **Step 1: Open Terminal in Backend Folder**

```powershell
cd "d:/M.tech at RVCE/Notes/1st sem/DSA_Lab/LineLessv1/backend"
```

### **Step 2: Start the Server**

```powershell
npm start
```

### **Step 3: Verify Connection**

You should see:
```
[dotenv] injecting env
MongoDB Connected
Server running on port 3000
```

✅ **If you see this, MongoDB is connected!**

❌ **If you see errors:**
- Check MongoDB is running (for local)
- Check connection string (for Atlas)
- Check firewall settings
- See troubleshooting section below

---

## 🧪 **TEST YOUR COMPLETE SYSTEM**

### **Test 1: Health Check**

Open browser or use curl:
```
http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

✅ **Backend is working!**

---

### **Test 2: User Registration (Signup)**

#### **A) Using Your Frontend:**

1. Open browser: `http://localhost:5198`
2. Click **"Get Started"** or **"Sign Up"**
3. Fill the form:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** Test@123
   - **Confirm Password:** Test@123

4. Click **"Create Account"**

**Expected Result:**
- ✅ Success message
- ✅ Redirects to dashboard
- ✅ Shows "Welcome, Test User!"

#### **B) Using curl (Alternative):**

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Test@123\"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

---

### **Test 3: User Login**

#### **A) Using Your Frontend:**

1. If logged in, click **Logout**
2. Go to: `http://localhost:5198/login`
3. Enter:
   - **Email:** test@example.com
   - **Password:** Test@123

4. Click **"Login"**

**Expected Result:**
- ✅ Success!
- ✅ Redirects to dashboard
- ✅ Shows user info

#### **B) Using curl:**

```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test@123\"}'
```

---

### **Test 4: Protected Routes**

#### **Test Dashboard Access:**

1. **Without Login:**
   - Go to: `http://localhost:5198/dashboard`
   - ✅ Should redirect to `/login`

2. **After Login:**
   - Login first
   - Go to: `http://localhost:5198/dashboard`
   - ✅ Should show dashboard

3. **Refresh Page:**
   - Press F5
   - ✅ Should stay logged in (auto-login works!)

---

### **Test 5: Logout**

1. Click **Logout** button in dashboard
2. Confirm logout
3. ✅ Should redirect to landing page
4. Try to access dashboard
5. ✅ Should redirect to login

---

### **Test 6: Verify Database**

#### **Using MongoDB Compass:**

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017` (or your Atlas cluster)
3. You should see database: **`lineless`**
4. Click on `lineless` → Collections
5. You should see: **`users`** collection
6. Click on `users`
7. ✅ You should see your test user!

#### **Using MongoDB Shell:**

```powershell
mongosh

use lineless
db.users.find().pretty()
```

You should see your user document!

---

## 🎯 **COMPLETE TESTING CHECKLIST**

### **Backend Tests:**
- [ ] MongoDB connected successfully
- [ ] Server running on port 3000
- [ ] Health check returns success
- [ ] User registration works
- [ ] User login works
- [ ] JWT token generated
- [ ] Database shows user data

### **Frontend Tests:**
- [ ] Landing page loads
- [ ] Signup form validates
- [ ] Signup creates user
- [ ] Redirects to dashboard after signup
- [ ] Login form validates
- [ ] Login authenticates user
- [ ] Redirects to dashboard after login
- [ ] Dashboard shows user info
- [ ] Protected routes work
- [ ] Auto-login works (refresh page)
- [ ] Logout works
- [ ] Redirects to login when accessing protected routes

### **Integration Tests:**
- [ ] Frontend → Backend communication works
- [ ] JWT tokens stored in localStorage
- [ ] Tokens sent with API requests
- [ ] 401 errors handled correctly
- [ ] Error messages display properly

---

## 🐛 **TROUBLESHOOTING**

### **Problem: MongoDB Won't Start**

**Solution:**
```powershell
# Check MongoDB service
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB

# If fails, check MongoDB is installed:
mongod --version
```

---

### **Problem: "MongoNetworkError: connect ECONNREFUSED"**

**Cause:** MongoDB not running

**Solution:**
```powershell
# For local MongoDB:
Start-Service MongoDB

# For Atlas:
# Check connection string in .env
# Verify IP whitelist in Atlas
```

---

### **Problem: "Authentication failed"**

**Cause:** Wrong credentials or user not created

**Solution:**
1. Check username/password in Atlas
2. Verify user has correct permissions
3. Try creating new user in Atlas

---

### **Problem: "CORS Error" in Browser**

**Cause:** Frontend and backend on different origins

**Solution:**
1. Check `backend/.env` has correct `FRONTEND_URL`
2. Restart backend after changing .env
3. Clear browser cache

---

### **Problem: "Network Error" on Signup/Login**

**Cause:** Backend not running

**Solution:**
```powershell
cd backend
npm start
```

---

### **Problem: Signup Works But Login Fails**

**Cause:** Password not hashed correctly or wrong password

**Solution:**
1. Create new user with different email
2. Check backend logs for errors
3. Verify bcrypt is installed: `npm list bcrypt`

---

### **Problem: Dashboard Shows "Loading..." Forever**

**Cause:** Auth guard blocking or token invalid

**Solution:**
1. Check browser console for errors
2. Check localStorage for token (DevTools → Application → Local Storage)
3. Try logging out and logging in again

---

## 📊 **VERIFY EVERYTHING WORKS**

### **Complete User Flow Test:**

```
1. Open http://localhost:5198
   ✅ Landing page loads

2. Click "Get Started"
   ✅ Redirects to /signup

3. Fill signup form and submit
   ✅ Creates user in database
   ✅ Returns JWT token
   ✅ Stores token in localStorage
   ✅ Redirects to /dashboard

4. See dashboard
   ✅ Shows "Welcome, [Your Name]!"
   ✅ Shows stats
   ✅ Shows sidebar

5. Refresh page (F5)
   ✅ Stays logged in
   ✅ Dashboard still shows

6. Click Logout
   ✅ Clears token
   ✅ Redirects to landing

7. Try to access /dashboard
   ✅ Redirects to /login

8. Login with same credentials
   ✅ Authenticates
   ✅ Redirects to dashboard

9. Close browser completely
10. Reopen and go to /dashboard
    ✅ Still logged in!
```

**If all steps pass, YOUR SYSTEM IS FULLY WORKING!** 🎉

---

## 🎉 **SUCCESS CRITERIA**

You'll know everything is working when:

✅ Backend starts without errors  
✅ MongoDB connection successful  
✅ Signup creates user in database  
✅ Login returns JWT token  
✅ Dashboard accessible after login  
✅ Auto-login works on refresh  
✅ Logout clears session  
✅ Protected routes redirect to login  

---

## 📸 **TAKE SCREENSHOTS!**

Document your working system:

1. MongoDB Compass showing user data
2. Backend terminal showing "MongoDB Connected"
3. Signup page with filled form
4. Dashboard after successful login
5. Browser DevTools showing JWT token in localStorage

**Add these to your portfolio!** 💼

---

## 🚀 **NEXT STEPS AFTER TESTING**

Once everything works:

1. ✅ **Test thoroughly** - Try edge cases
2. ✅ **Create more users** - Test with multiple accounts
3. ✅ **Test error cases** - Wrong password, duplicate email
4. ✅ **Build more features** - Organizations, Services, Queue
5. ✅ **Deploy** - Host on cloud platform

---

## 💡 **QUICK COMMANDS REFERENCE**

```powershell
# Start MongoDB (if not running)
Start-Service MongoDB

# Start Backend
cd backend
npm start

# Start Frontend (should already be running)
cd frontend
ng serve

# Check MongoDB
mongosh
use lineless
db.users.find()

# Test API
curl http://localhost:3000/health
```

---

## 🎯 **YOU'RE READY!**

Follow this guide step by step, and you'll have a **fully working, production-ready authentication system**!

**Let's get started!** 🚀

---

**Need help? Check the troubleshooting section or let me know!** 💬
