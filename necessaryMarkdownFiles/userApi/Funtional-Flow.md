# 🔄 FUNCTIONAL FLOW EXPLANATION

## Understanding How Everything Works Together

This document explains the EXACT flow of data and execution when a user interacts with the API.

---

## 📋 TABLE OF CONTENTS

1. [Registration Flow (Detailed)](#registration-flow-detailed)
2. [Login Flow (Detailed)](#login-flow-detailed)
3. [Protected Route Access](#protected-route-access)
4. [Error Handling Flow](#error-handling-flow)
5. [Middleware Execution Order](#middleware-execution-order)

---

## 1️⃣ REGISTRATION FLOW (DETAILED)

### User clicks "Register" button

```
Frontend (Browser)
    ↓
    Sends POST request to: http://localhost:5000/api/users/register
    Body: { firstName, lastName, email, password, ... }
    ↓
Backend (Express Server)
```

### Step-by-Step Execution

#### **Step 1: Request Hits Server**
```javascript
// In app.js
app.use("/api", routes);  // Routes all /api/* requests to routes/index.js
```

#### **Step 2: Route Matching**
```javascript
// In routes/index.js
router.use("/users", userRoutes);  // Routes /api/users/* to users router
```

#### **Step 3: User Route Handler**
```javascript
// In modules/users/users.router.js
router.post(
    "/register",
    validateRequest(registerUserSchema),  // ← Step 4
    asyncHandler(registerUser)            // ← Step 6
);
```

#### **Step 4: Validation Middleware**
```javascript
// In common/middlewares/validateRequest.js
const validateRequest = (schemas) => (req, res, next) => {
    // Validates req.body against registerUserSchema
    
    // If validation fails:
    return next(new AppError(
        "Validation Failed",
        400,
        "VALIDATION_ERROR",
        { errors: [...] }
    )); // ← Goes to error handler
    
    // If validation succeeds:
    next(); // ← Moves to next middleware (asyncHandler)
};
```

**What happens in validation?**
- Checks if email is valid format
- Checks if password is at least 6 characters
- Checks if passwords match
- Checks if all required fields are present
- Removes unknown fields (sanitization)

#### **Step 5: Async Handler Wrapper**
```javascript
// In common/middlewares/asyncHandler.js
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
        // If fn throws error, catch it and send to error handler
    };
};
```

**What does this do?**
- Wraps the controller function
- Catches any errors thrown in the controller or service
- Automatically sends errors to globalErrorHandler

#### **Step 6: Controller Function**
```javascript
// In modules/users/users.controller.js
const registerUser = async (req, res) => {
    // Step 6a: Extract data from request
    const userData = req.body;
    
    // Step 6b: Call service layer (business logic)
    const result = await userService.registerUser(userData);
    // ↑ This is where the magic happens!
    
    // Step 6c: Send success response
    sendSuccess(
        res,
        result.message,
        { email: result.email },
        null,
        201
    );
};
```

#### **Step 7: Service Layer (Business Logic)**
```javascript
// In modules/users/users.service.js
const registerUser = async (payload) => {
    // Step 7a: Check if user already exists
    const existingUser = await User.findOne({ email: payload.email });
    
    if (existingUser) {
        // If email is verified, they should login
        if (existingUser.isEmailVerified) {
            throw new AppError(
                "User already exists. Please login.",
                409,
                "USER_ALREADY_EXISTS"
            );
        }
        
        // If email not verified, resend OTP
        const otp = existingUser.generateOTP();
        await existingUser.save();
        await sendOTPEmail(existingUser.email, otp);
        return { message: "OTP resent...", email: existingUser.email };
    }
    
    // Step 7b: Create new user
    const user = await User.create({
        ...payload,
        isEmailVerified: false  // Email not verified yet
    });
    // ↑ Password is automatically hashed by pre-save middleware
    
    // Step 7c: Generate OTP
    const otp = user.generateOTP();  // Generates 6-digit OTP
    await user.save();
    // ↑ Saves OTP and expiry time to database
    
    // Step 7d: Send OTP email
    try {
        await emailService.sendEmail({
            to: user.email,
            subject: "JAIRAM - Email Verification OTP",
            html: emailTemplates.otpTemplate(user.firstName, otp)
        });
    } catch (emailError) {
        // If email fails, delete the user (rollback)
        await User.findByIdAndDelete(user._id);
        throw new AppError(
            "Failed to send email. Please try again.",
            500,
            "EMAIL_SEND_FAILED"
        );
    }
    
    // Step 7e: Return success
    return {
        message: "Registration successful! OTP sent to your email.",
        email: user.email
    };
};
```

#### **Step 8: Database Operations**

**When user is created:**
```javascript
// In modules/users/users.model.js

// PRE-SAVE MIDDLEWARE (runs before saving)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    // Hash the password
    this.password = await hash(this.password, 10);
    // Original: "Test123"
    // Hashed: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36..."
    
    next();
});

// Then MongoDB saves:
{
    _id: ObjectId("..."),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36...",
    isEmailVerified: false,
    emailVerificationOTP: "123456",
    emailVerificationOTPExpires: Date("2024-01-15T11:00:00Z"),
    createdAt: Date("2024-01-15T10:50:00Z"),
    updatedAt: Date("2024-01-15T10:50:00Z")
}
```

#### **Step 9: Email Sending**

```javascript
// In infrastructure/email/email.service.js
const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: "JAIRAM <your-email@gmail.com>",
        to: "john@example.com",
        subject: "JAIRAM - Email Verification OTP",
        html: "<html>Your OTP is: 123456</html>"
    };
    
    await transporter.sendMail(mailOptions);
    // ↑ Nodemailer sends email via Gmail SMTP
};
```

#### **Step 10: Response to Frontend**

```javascript
// In common/utils/responseHandler.js
const sendSuccess = (res, message, data, meta, statusCode) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta
    });
};

// Final response:
{
    success: true,
    message: "Registration successful! OTP sent to your email.",
    data: {
        email: "john@example.com"
    }
}
```

**Frontend receives this and:**
- Shows success message
- Displays OTP input form
- Stores email in state
- Waits for user to enter OTP

---

## 2️⃣ LOGIN FLOW (DETAILED)

### User enters email and password, clicks "Login"

#### **Step 1-6: Same as Registration**
Request → Router → Validation → AsyncHandler → Controller

#### **Step 7: Login Service**

```javascript
// In modules/users/users.service.js
const loginUser = async (email, password) => {
    // Step 7a: Find user by email (with password)
    const user = await User.findByEmail(email);
    // ↑ Custom static method that includes password field
    
    if (!user) {
        throw new AppError(
            "Invalid email or password",  // Don't reveal which one is wrong (security)
            401,
            "INVALID_CREDENTIALS"
        );
    }
    
    // Step 7b: Verify password
    const isPasswordValid = await user.comparePassword(password);
    // ↑ Instance method that uses bcrypt.compare()
    
    // bcrypt.compare does this:
    // Takes user input: "Test123"
    // Takes stored hash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36..."
    // Hashes "Test123" with same salt
    // Compares the two hashes
    // Returns true if they match
    
    if (!isPasswordValid) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }
    
    // Step 7c: Check if email is verified
    if (!user.isEmailVerified) {
        throw new AppError(
            "Please verify your email before logging in",
            403,
            "EMAIL_NOT_VERIFIED",
            { email: user.email }
        );
    }
    
    // Step 7d: Generate JWT token
    const token = generateToken(user);
    // ↑ Creates JWT with user.id and user.role
    
    // Step 7e: Return token and user data
    return {
        message: "Login successful",
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,  // Virtual property
            email: user.email,
            role: user.role,
            profession: user.profession,
            isEmailVerified: user.isEmailVerified
        }
    };
};
```

#### **Step 8: JWT Token Generation**

```javascript
// In common/utils/jwtToken.js
const generateToken = (user) => {
    return sign(
        {
            id: user._id,        // User's MongoDB ID
            role: user.role      // User's role (USER, ADMIN, etc.)
        },
        process.env.JWT_SECRET,  // Secret key from .env
        { expiresIn: "7d" }     // Token expires in 7 days
    );
};

// Example token created:
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTc4ZjNlNGIyMzQ1Njc4OWFiY2RlZiIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzA1MzE2OTI2LCJleHAiOjE3MDU5MjE3MjZ9.Xz7JKL8Q9mN3PqR5sT6uV8wY0zA1bC2dE3fG4hI5jK6"

// This token contains (decoded):
{
    "id": "65a78f3e4b2345678 9abcdef",
    "role": "USER",
    "iat": 1705316926,  // Issued at (timestamp)
    "exp": 1705921726   // Expires at (timestamp)
}
```

#### **Step 9: Response to Frontend**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "65a78f3e4b23456789abcdef",
            "firstName": "John",
            "lastName": "Doe",
            "fullName": "John Doe",
            "email": "john@example.com",
            "role": "USER",
            "profession": "DOCTOR",
            "isEmailVerified": true
        }
    }
}
```

**Frontend stores token:**
```javascript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

---

## 3️⃣ PROTECTED ROUTE ACCESS

### User wants to view their profile (GET /api/users/me)

#### **Step 1: Frontend Sends Request with Token**

```javascript
fetch('http://localhost:5000/api/users/me', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})
```

#### **Step 2: Global Middleware (optionalAuth)**

```javascript
// In app.js (applied globally to ALL requests)
app.use(optionalAuth);

// In common/middlewares/optionalAuth.js
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // No token → continue as anonymous user
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }
    
    // Extract token
    const token = authHeader.split(" ")[1];
    // "Bearer eyJhbGci..." → "eyJhbGci..."
    
    try {
        // Verify and decode token
        const decoded = verify(token, process.env.JWT_SECRET);
        // decoded = { id: "...", role: "USER", iat: ..., exp: ... }
        
        // Add user info to request
        req.user = decoded;
        // Now req.user = { id: "...", role: "USER" }
        
        next();
    } catch (err) {
        // Invalid token → error
        return next(new AppError("Invalid or expired token", 401));
    }
};
```

**What happens here?**
- Every request passes through this middleware
- If token exists → decode it and set `req.user`
- If no token → set `req.user = null`
- All subsequent middlewares and controllers can access `req.user`

#### **Step 3: Route-Specific Middleware (requireAuth)**

```javascript
// In modules/users/users.router.js
router.get(
    "/me",
    requireAuth,  // ← Checks if req.user exists
    asyncHandler(getCurrentUser)
);

// In common/middlewares/requireAuth.js
const requireAuth = (req, res, next) => {
    if (!req.user) {
        // No user → not authenticated
        return next(new AppError("Authentication required", 401));
    }
    // User exists → continue
    next();
};
```

**Flow so far:**
```
Request with token
    ↓
optionalAuth middleware (decodes token, sets req.user)
    ↓
requireAuth middleware (checks if req.user exists)
    ↓
asyncHandler (catches errors)
    ↓
getCurrentUser controller
```

#### **Step 4: Controller Uses req.user**

```javascript
// In modules/users/users.controller.js
const getCurrentUser = async (req, res) => {
    // req.user was set by optionalAuth middleware
    // req.user = { id: "65a78f3e4b23456789abcdef", role: "USER" }
    
    const result = await userService.getUserById(req.user.id);
    
    sendSuccess(res, result.message, { user: result.user });
};
```

#### **Step 5: Service Fetches User from Database**

```javascript
// In modules/users/users.service.js
const getUserById = async (userId) => {
    const user = await User.findById(userId);
    // ↑ Finds user by ID from token
    
    if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    
    return {
        message: "User retrieved successfully",
        user  // Password excluded by model's toJSON transform
    };
};
```

---

## 4️⃣ ERROR HANDLING FLOW

### What happens when an error occurs?

#### **Scenario: User tries to login with wrong password**

```javascript
// In service layer
const isPasswordValid = await user.comparePassword(password);

if (!isPasswordValid) {
    throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS"
    );
}
```

#### **Step 1: Error Thrown**

```javascript
// Error object created:
{
    message: "Invalid email or password",
    statusCode: 401,
    errorCode: "INVALID_CREDENTIALS",
    details: {},
    isOperational: true
}
```

#### **Step 2: AsyncHandler Catches Error**

```javascript
// In asyncHandler
Promise.resolve(fn(req, res, next)).catch(next);
// ↑ Catches the error and sends it to next()
// next(error) → passes error to error handling middleware
```

#### **Step 3: Global Error Handler**

```javascript
// In common/errors/errorHandler.js
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    let message = err.message || "Something went wrong";
    let details = err.details || {};
    
    // If NOT an operational error (programming error)
    if (!err.isOperational) {
        statusCode = 500;
        errorCode = "INTERNAL_SERVER_ERROR";
        message = "Something went wrong. Please try again later.";
        // Don't expose internal error details to user
    }
    
    // Send error response
    return res.status(statusCode).json({
        success: false,
        errorCode,
        message,
        details
    });
};
```

#### **Step 4: Response to Frontend**

```json
{
    "success": false,
    "errorCode": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
}
```

**Frontend handles error:**
```javascript
const data = await response.json();

if (!data.success) {
    // Show error to user
    setError(data.message);
}
```

---

## 5️⃣ MIDDLEWARE EXECUTION ORDER

### For Protected Routes

```
Request arrives
    ↓
1. CORS middleware (from cors package)
    ↓
2. Body Parser (json, urlencoded)
    ↓
3. optionalAuth (global - decodes token if present)
    ↓
4. Route matching (/api/users/me)
    ↓
5. requireAuth (route-specific - checks if authenticated)
    ↓
6. allowRoles (route-specific - checks if authorized) [if present]
    ↓
7. validateRequest (route-specific - validates input) [if present]
    ↓
8. asyncHandler (wraps controller)
    ↓
9. Controller function
    ↓
10. Service function
    ↓
11. Database operation
    ↓
12. Response sent to client
```

### If Error Occurs at Any Step

```
Error thrown
    ↓
asyncHandler catches it (or Express catches it)
    ↓
Sent to next(error)
    ↓
globalErrorHandler
    ↓
Error response sent to client
```

---

## 🎯 Key Takeaways

1. **Request Flow**: Request → Middleware → Controller → Service → Database → Response

2. **Error Flow**: Error → AsyncHandler → Global Error Handler → Error Response

3. **Authentication**: Token → optionalAuth (decode) → requireAuth (verify) → Controller

4. **Validation**: Request → validateRequest → Valid? → Controller : Error

5. **Data Transform**: Request Body → Validation → Service → Database → Model Methods → Response

---

## 💡 Understanding This Flow Will Help You:

1. Debug issues faster (you know exactly where to look)
2. Add new features (you know where to put code)
3. Understand security (you see how authentication works)
4. Write better code (you understand the architecture)
5. Build other modules (same pattern for Author, Editor, etc.)

---

This is the foundation of your entire system. Master this flow, and building the rest will be much easier!