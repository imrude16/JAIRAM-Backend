import { AppError } from "../../common/errors/AppError.js";
import { STATUS_CODES } from "../../common/constants/statusCodes.js";
import { User } from "./users.model.js";
import { generateToken }  from "../../common/utils/jwtToken.js";               
import { sendEmail } from "../../infrastructure/email/email.service.js";      
import { otpTemplate } from "../../infrastructure/email/email.template.js";   

/**
 * USER SERVICE LAYER
 * 
 * This layer contains all the business logic for user operations.
 * It sits between the controller (handles HTTP) and the model (database).
 * 
 * Responsibilities:
 * - Validate business rules
 * - Interact with database
 * - Send emails
 * - Generate tokens
 * - Throw errors when something goes wrong
 */

// ========================================
// REGISTRATION FLOW (2-STEP PROCESS)
// ========================================

/**
 * STEP 1: REGISTER USER (Send OTP)
 * 
 * Process:
 * 1. Check if email already exists
 * 2. Create user (unverified)
 * 3. Generate OTP
 * 4. Send OTP via email
 * 5. Return success message (don't expose sensitive data)
 * 
 * @param {Object} payload - User registration data
 * @returns {Promise<Object>} - Success message
 */
const registerUser = async (payload) => {
    // Step 1: Check if user already exists
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
        // If user exists and email is verified, they should login instead
        if (existingUser.isEmailVerified) {
            throw new AppError(
                "An account with this email already exists. Please login.",
                STATUS_CODES.CONFLICT,
                "USER_ALREADY_EXISTS"
            );
        }

        // If user exists but email not verified, resend OTP
        const otp = existingUser.generateOTP();
        await existingUser.save();

        // Send OTP email
        await sendEmail({
            to: existingUser.email,
            subject: "JAIRAM - Email Verification OTP",
            html: otpTemplate(
                existingUser.firstName,
                otp
            ),
        });

        return {
            message: "OTP resent successfully. Please check your email.",
            email: existingUser.email,
        };
    }

    // Step 2: Create new user (unverified)
    const user = await User.create({
        ...payload,
        isEmailVerified: false,
    });

    console.log("🟢 User created:", user._id);  //debugger

    console.log("🟡 Generating OTP...");  //debugger

    // Step 3: Generate OTP
    const otp = user.generateOTP();
    console.log("🟡 Generating OTP...");  //debugger
    await user.save();
    console.log("🟡 OTP generated:", otp);  //debugger

    console.log("🔴 Attempting to send email...");  //debugger

    // Step 4: Send OTP via email
    try {
        await sendEmail({
            to: user.email,
            subject: "JAIRAM - Email Verification OTP",
            html: otpTemplate(user.firstName, otp),
        });

        console.log("🔴 Email sent successfully!");  //debugger

    } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);  //debugger

        // If email fails, delete the user and throw error
        await User.findByIdAndDelete(user._id);
        
        throw new AppError(
            "Failed to send verification email. Please try again.",
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            "EMAIL_SEND_FAILED"
        );
    }

     console.log("✅ Registration completed successfully");  //debugger

    // Step 5: Return success (don't expose user data or OTP)
    return {
        message: "Registration successful! OTP sent to your email.",
        email: user.email,
    };
};

/**
 * STEP 2: VERIFY OTP
 * 
 * Process:
 * 1. Find user by email
 * 2. Verify OTP
 * 3. Mark email as verified
 * 4. Generate JWT token
 * 5. Return token and user data
 * 
 * @param {string} email - User's email
 * @param {string} otp - OTP from email
 * @returns {Promise<Object>} - Token and user data
 */
const verifyOTP = async (email, otp) => {
    // Step 1: Find user with OTP fields included
    const user = await User.findOne({ email })
        .select("+emailVerificationOTP +emailVerificationOTPExpires");

    if (!user) {
        throw new AppError(
            "User not found",
            STATUS_CODES.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new AppError(
            "Email already verified. Please login.",
            STATUS_CODES.BAD_REQUEST,
            "EMAIL_ALREADY_VERIFIED"
        );
    }

    // Step 2: Verify OTP
    const isValidOTP = user.verifyOTP(otp);

    if (!isValidOTP) {
        throw new AppError(
            "Invalid or expired OTP",
            STATUS_CODES.BAD_REQUEST,
            "INVALID_OTP"
        );
    }

    // Step 3: Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    // Step 4: Generate JWT token
    const token = generateToken(user);

    // Step 5: Return token and user data (password excluded by model)
    return {
        message: "Email verified successfully",
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profession: user.profession,
            isEmailVerified: user.isEmailVerified,
        },
    };
};

/**
 * RESEND OTP
 * 
 * Allows user to request a new OTP if the previous one expired
 * 
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Success message
 */
const resendOTP = async (email) => {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(
            "User not found",
            STATUS_CODES.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new AppError(
            "Email already verified. Please login.",
            STATUS_CODES.BAD_REQUEST,
            "EMAIL_ALREADY_VERIFIED"
        );
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
        await sendEmail({
            to: user.email,
            subject: "JAIRAM - Email Verification OTP",
            html: otpTemplate(user.firstName, otp),
        });
    } catch (emailError) {
        throw new AppError(
            "Failed to send verification email. Please try again.",
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            "EMAIL_SEND_FAILED"
        );
    }

    return {
        message: "OTP resent successfully. Please check your email.",
        email: user.email,
    };
};

// ========================================
// LOGIN
// ========================================

/**
 * LOGIN USER
 * 
 * Process:
 * 1. Find user by email (with password)
 * 2. Verify password
 * 3. Check if email is verified
 * 4. Generate JWT token
 * 5. Return token and user data
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Token and user data
 */
const loginUser = async (email, password) => {
    // Step 1: Find user with password included
    const user = await User.findByEmail(email);

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            STATUS_CODES.UNAUTHORIZED,
            "INVALID_CREDENTIALS"
        );
    }

    // Step 2: Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(
            "Invalid email or password",
            STATUS_CODES.UNAUTHORIZED,
            "INVALID_CREDENTIALS"
        );
    }

    // Step 3: Check if email is verified
    if (!user.isEmailVerified) {
        throw new AppError(
            "Please verify your email before logging in",
            STATUS_CODES.FORBIDDEN,
            "EMAIL_NOT_VERIFIED",
            { email: user.email }
        );
    }

    // Step 4: Check account status
    if (user.status !== "ACTIVE") {
        throw new AppError(
            "Your account has been suspended. Please contact support.",
            STATUS_CODES.FORBIDDEN,
            "ACCOUNT_SUSPENDED"
        );
    }

    // Step 5: Generate JWT token
    const token = generateToken(user);

    // Step 6: Return token and user data
    return {
        message: "Login successful",
        token,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profession: user.profession,
            isEmailVerified: user.isEmailVerified,
        },
    };
};

// ========================================
// USER PROFILE OPERATIONS
// ========================================

/**
 * GET USER BY ID
 * 
 * Returns user profile data
 * 
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} - User data
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            "User not found",
            STATUS_CODES.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }

    return {
        message: "User retrieved successfully",
        user,
    };
};

/**
 * UPDATE USER PROFILE
 * 
 * Allows user to update their profile information
 * (except email and password)
 * 
 * @param {string} userId - User's ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated user data
 */
const updateUserProfile = async (userId, updates) => {
    // Prevent updating sensitive fields
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.isEmailVerified;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new AppError(
            "User not found",
            STATUS_CODES.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }

    return {
        message: "Profile updated successfully",
        user,
    };
};

/**
 * CHANGE PASSWORD
 * 
 * Allows user to change their password
 * 
 * @param {string} userId - User's ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Success message
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    // Find user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new AppError(
            "User not found",
            STATUS_CODES.NOT_FOUND,
            "USER_NOT_FOUND"
        );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
        throw new AppError(
            "Current password is incorrect",
            STATUS_CODES.UNAUTHORIZED,
            "INVALID_PASSWORD"
        );
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    return {
        message: "Password changed successfully",
    };
};

// ========================================
// EMAIL AVAILABILITY CHECK (UX IMPROVEMENT)
// ========================================

/**
 * CHECK EMAIL AVAILABILITY
 * 
 * This solves your UX problem!
 * 
 * Call this endpoint when user types email or on blur event.
 * It checks if email is already registered WITHOUT requiring
 * the user to fill the entire form first.
 * 
 * Frontend Usage:
 * - On email input blur: checkEmailAvailability(email)
 * - Show real-time feedback: "Email available ✓" or "Email already exists ✗"
 * 
 * @param {string} email - Email to check
 * @returns {Promise<Object>} - Availability status
 */
const checkEmailAvailability = async (email) => {
    const user = await User.findOne({ email });

    if (user && user.isEmailVerified) {
        return {
            available: false,
            message: "This email is already registered. Please login or use a different email.",
        };
    }

    if (user && !user.isEmailVerified) {
        return {
            available: false,
            message: "This email is registered but not verified. Please complete verification or use a different email.",
        };
    }

    return {
        available: true,
        message: "Email is available",
    };
};

// ========================================
// EXPORTS
// ========================================

export default {   // check here - a inconsistency in export style (default vs named)
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    getUserById,
    updateUserProfile,
    changePassword,
    checkEmailAvailability,
};