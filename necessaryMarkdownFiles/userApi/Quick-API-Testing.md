# 🚀 QUICK START GUIDE

## Get Running in 5 Minutes!

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Create .env File (2 min)

Create a `.env` file in the root directory:

```env
# Minimum required configuration
MONGO_URI=mongodb://localhost:27017/jairam
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Quick Gmail Setup**:
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password
3. Copy the 16-digit code
4. Paste it in `EMAIL_PASS`

### Step 3: Start MongoDB (1 min)
```bash
# Option 1: Local MongoDB
mongod

# Option 2: Use MongoDB Atlas (cloud)
# Just update MONGO_URI in .env with your Atlas connection string
```

### Step 4: Start Server (1 min)
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

---

## 🧪 Test the APIs (Postman)

### 1. Register a User

**POST** `http://localhost:5000/api/users/register`

**Body** (JSON):
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "Test123",
  "confirmPassword": "Test123",
  "profession": "DOCTOR",
  "primarySpecialty": "Cardiology",
  "institution": "Test Hospital",
  "department": "Cardiology Dept",
  "phoneCode": "+1",
  "mobileNumber": "1234567890",
  "address": {
    "country": "United States"
  },
  "isScreenAccepted": true
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Registration successful! OTP sent to your email.",
  "data": {
    "email": "test@example.com"
  }
}
```

---

### 2. Check Your Email or Server Logs

**In Server Console**, you'll see the OTP:
```
📧 OTP for test@example.com: 123456
```

OR check your email inbox for the OTP.

---

### 3. Verify OTP

**POST** `http://localhost:5000/api/users/verify-otp`

**Body** (JSON):
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      ...
    }
  }
}
```

**IMPORTANT**: Copy the `token` from the response!

---

### 4. Get User Profile (Protected Route)

**GET** `http://localhost:5000/api/users/me`

**Headers**:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "...",
      "firstName": "Test",
      "lastName": "User",
      "fullName": "Test User",
      "email": "test@example.com",
      ...
    }
  }
}
```

---

## ✅ Success!

If all 4 steps worked, your authentication system is running perfectly!

---

## 🎯 What to Test Next

1. **Login** - `POST /api/users/login`
2. **Update Profile** - `PATCH /api/users/me`
3. **Change Password** - `POST /api/users/change-password`
4. **Check Email** - `GET /api/users/check-email?email=test@example.com`
5. **Resend OTP** - `POST /api/users/resend-otp`

See `API_DOCUMENTATION.md` for complete API details.

---

## 🐛 Quick Troubleshooting

### Can't connect to MongoDB?
```bash
# Install MongoDB locally:
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Or use MongoDB Atlas (free cloud database):
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Update MONGO_URI in .env
```

### Email not sending?
```bash
# Make sure you're using Gmail App Password, not regular password
# 1. Enable 2FA on your Google account
# 2. Generate app password: https://myaccount.google.com/apppasswords
# 3. Use the 16-digit password in EMAIL_PASS
```

### Port 5000 already in use?
```bash
# Change port in .env:
PORT=3001

# Or kill the process using port 5000:
# Windows: netstat -ano | findstr :5000
#          taskkill /PID <PID> /F
# Mac/Linux: lsof -i :5000
#            kill -9 <PID>
```

---

## 📖 Next Steps

1. Read `README.md` for complete understanding
2. Check `API_DOCUMENTATION.md` for all endpoints
3. Explore the code files to understand the architecture
4. Start building the next module (Author, Editor, etc.)

---

Happy Coding! 🎉