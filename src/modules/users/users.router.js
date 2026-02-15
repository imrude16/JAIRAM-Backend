import { Router } from "express";

import { requireAuth } from "../../common/middlewares/requireAuth.js";
import { allowRoles } from "../../common/middlewares/roleBaseMiddleware.js";
import { ROLES } from "../../common/constants/roles.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import  userController  from "./users.controller.js";  // check here - a inconsistency in import style 
import {
    registerUserSchema,
    verifyOTPSchema,
    resendOTPSchema,
    loginUserSchema,
    getUserByIdSchema,
    updateUserSchema,
    changePasswordSchema,
    checkEmailSchema,
} from "./users.validator.js";


const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    getCurrentUser,
    getUserById,
    updateUserProfile,
    changePassword,
    checkEmailAvailability,
} = userController;

const router = Router();

/**
 * USER ROUTES
 * 
 * This file defines all HTTP endpoints for user operations.
 * 
 * Route Structure:
 * - Public routes (no authentication required)
 * - Protected routes (authentication required)
 * - Admin routes (admin role required)
 * 
 * Middleware Flow:
 * Request → validateRequest → asyncHandler → controller → service → database
 *                                ↓
 *                          globalErrorHandler (if error occurs)
 */


// ========================================
// PUBLIC ROUTES (No Authentication Required)
// ========================================
/*
 * CHECK EMAIL AVAILABILITY FOR REGISTRATION
 *
 * GET /api/users/check-email?email=example@email.com
 * 
 * Purpose: Check if email is already registered
 * Use Case: Real-time validation during registration
*/
router.get(
    "/check-email",
    validateRequest(checkEmailSchema),
    asyncHandler(checkEmailAvailability)
);


/*
 * REGISTER USER (Step 1: Send OTP)
 * 
 * POST /api/users/register
 * Body: {
 *   firstName, lastName, email, password, confirmPassword,
 *   profession, primarySpecialty, institution, department,
 *   phoneCode, mobileNumber, address, termsAccepted
 * }
*/
router.post(
    "/register",
    validateRequest(registerUserSchema),
    asyncHandler(registerUser)
);

/**
 * VERIFY OTP (Step 2: Complete Registration)
 * 
 * POST /api/users/verify-otp
 * Body: { email, otp }
 */
router.post(
    "/verify-otp",
    validateRequest(verifyOTPSchema),
    asyncHandler(verifyOTP)
);

/**
 * RESEND OTP
 * 
 * POST /api/users/resend-otp
 * Body: { email }
 */
router.post(
    "/resend-otp",
    validateRequest(resendOTPSchema),
    asyncHandler(resendOTP)
);

/**
 * LOGIN USER
 * 
 * POST /api/users/login
 * Body: { email, password }
 */
router.post(
    "/login",
    validateRequest(loginUserSchema),
    asyncHandler(loginUser)
);


// ========================================
// PROTECTED ROUTES (Authentication Required)
// ========================================
/**
 * GET CURRENT USER
 * 
 * GET /api/users/me
 * Headers: Authorization: Bearer <token>
 */
router.get(
    "/me",
    requireAuth,
    asyncHandler(getCurrentUser)
);

/**
 * UPDATE CURRENT USER'S PROFILE
 * 
 * PATCH /api/users/me
 * Headers: Authorization: Bearer <token>
 * Body: { firstName, lastName, phoneNumber, address, ... }
 */
router.patch(
    "/me",
    requireAuth,
    validateRequest(updateUserSchema),
    asyncHandler(updateUserProfile)
);

/**
 * CHANGE PASSWORD
 * 
 * POST /api/users/change-password
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword, confirmNewPassword }
 */
router.post(
    "/change-password",
    requireAuth,
    validateRequest(changePasswordSchema),
    asyncHandler(changePassword)
);


// ========================================
// ADMIN ROUTES (Admin Access Only)
// ========================================
/**
 * GET USER BY ID
 * 
 * GET /api/users/:id
 * Headers: Authorization: Bearer <token>
 * 
 * Access: Admin only
 * Purpose: View any user's profile (for admin dashboard)
 */
router.get(
    "/:id",
    requireAuth,
    allowRoles(ROLES.ADMIN),
    validateRequest(getUserByIdSchema),
    asyncHandler(getUserById)
);

/**
 * UPDATE ANY USER (Admin)
 * 
 * PATCH /api/users/:id
 * Headers: Authorization: Bearer <token>
 * Body: { firstName, lastName, role, status, ... }
 * 
 * Access: Admin only
 * Purpose: Update any user's profile (including role and status)
 */
router.patch(
    "/:id",
    requireAuth,
    allowRoles(ROLES.ADMIN),
    validateRequest(updateUserSchema),
    asyncHandler(updateUserProfile)
);

export default router ; // check here - a inconsistency in export style 