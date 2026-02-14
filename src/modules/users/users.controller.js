import userService from "./users.service.js";   // check here - a inconsistency in import style 
import { sendSuccess } from "../../common/utils/responseHandler.js";
import { STATUS_CODES } from "../../common/constants/statusCodes.js";

/**
 * USER CONTROLLER LAYER
 * 
 * This layer handles HTTP requests and responses.
 * It receives data from routes, calls service functions,
 * and sends responses back to the client.
 * 
 * Responsibilities:
 * - Extract data from req (body, params, query)
 * - Call appropriate service function
 * - Send success response
 * - Errors are automatically caught by asyncHandler and sent to globalErrorHandler
 */

// ========================================
// REGISTRATION ENDPOINTS
// ========================================

/**
 * REGISTER USER (Step 1)
 * 
 * POST /api/users/register
 * Body: { firstName, lastName, email, password, ... }
 * 
 * Response: { success: true, message: "...", data: { email } }
 */
const registerUser = async (req, res) => {

    // Call service layer (business logic)
    const result = await userService.registerUser(req.body);

    // Send success response
    sendSuccess(
        res,
        result.message,
        { email: result.email },
        null,
        STATUS_CODES.CREATED
    );
};

/**
 * VERIFY OTP (Step 2)
 * 
 * POST /api/users/verify-otp
 * Body: { email, otp }
 * 
 * Response: { success: true, message: "...", data: { token, user } }
 */
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    // Call service layer
    const result = await userService.verifyOTP(email, otp);

    // Send success response with token
    sendSuccess(
        res,
        result.message,
        {
            token: result.token,
            user: result.user,
        },
        null,
        STATUS_CODES.OK
    );
};

/**
 * RESEND OTP
 * 
 * POST /api/users/resend-otp
 * Body: { email }
 * 
 * Response: { success: true, message: "...", data: { email } }
 */
const resendOTP = async (req, res) => {
    const { email } = req.body;

    // Call service layer
    const result = await userService.resendOTP(email);

    // Send success response
    sendSuccess(
        res,
        result.message,
        { email: result.email },
        null,
        STATUS_CODES.OK
    );
};

// ========================================
// AUTHENTICATION ENDPOINTS
// ========================================

/**
 * LOGIN USER
 * 
 * POST /api/users/login
 * Body: { email, password }
 * 
 * Response: { success: true, message: "...", data: { token, user } }
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Call service layer
    const result = await userService.loginUser(email, password);

    // Send success response with token
    sendSuccess(
        res,
        result.message,
        {
            token: result.token,
            user: result.user,
        },
        null,
        STATUS_CODES.OK
    );
};

// ========================================
// PROFILE ENDPOINTS
// ========================================

/**
 * GET CURRENT USER
 * 
 * GET /api/users/me
 * Headers: Authorization: Bearer <token>
 * 
 * Response: { success: true, message: "...", data: { user } }
 * 
 * Note: req.user is set by requireAuth middleware
 */
const getCurrentUser = async (req, res) => {
    // req.user is set by requireAuth middleware
    const result = await userService.getUserById(req.user.id);

    // Send success response
    sendSuccess(
        res,
        result.message,
        { user: result.user },
        null,
        STATUS_CODES.OK
    );
};

/**
 * GET USER BY ID
 * 
 * GET /api/users/:id
 * Headers: Authorization: Bearer <token>
 * 
 * Response: { success: true, message: "...", data: { user } }
 */
const getUserById = async (req, res) => {
    const { id } = req.params;

    // Call service layer
    const result = await userService.getUserById(id);

    // Send success response
    sendSuccess(
        res,
        result.message,
        { user: result.user },
        null,
        STATUS_CODES.OK
    );
};

/**
 * UPDATE USER PROFILE
 * 
 * PATCH /api/users/:id
 * Headers: Authorization: Bearer <token>
 * Body: { firstName, lastName, phoneNumber, ... }
 * 
 * Response: { success: true, message: "...", data: { user } }
 */
const updateUserProfile = async (req, res) => {
    // For /me route, use req.user.id (from auth middleware)
    // For /:id route, use req.params.id (admin updating any user)
    const userId = req.params.id || req.user.id;
    const updates = req.body;

    console.log("🟣 [UPDATE-PROFILE] User ID:", userId); // debugger
    console.log("🟣 [UPDATE-PROFILE] Updates:", updates); // debugger

    // Call service layer
    const result = await userService.updateUserProfile(userId, updates);

    // Send success response
    sendSuccess(
        res,
        result.message,
        { user: result.user },
        null,
        STATUS_CODES.OK
    );
};

/**
 * CHANGE PASSWORD
 * 
 * POST /api/users/change-password
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword, confirmNewPassword }
 * 
 * Response: { success: true, message: "..." }
 */
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Call service layer (uses req.user.id from auth middleware)
    const result = await userService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
    );

    // Send success response
    sendSuccess(
        res,
        result.message,
        null,
        null,
        STATUS_CODES.OK
    );
};

// ========================================
// UTILITY ENDPOINTS
// ========================================

/**
 * CHECK EMAIL AVAILABILITY
 * 
 * GET /api/users/check-email?email=example@email.com
 * 
 * Response: { success: true, message: "...", data: { available } }
 * 
 * USAGE IN FRONTEND:
 * 
 * ```javascript
 * // On email input blur or onChange (with debounce)
 * const checkEmail = async (email) => {
 *   const response = await fetch(`/api/users/check-email?email=${email}`);
 *   const data = await response.json();
 *   
 *   if (!data.data.available) {
 *     // Show error message
 *     setEmailError(data.data.message);
 *   } else {
 *     // Clear error
 *     setEmailError(null);
 *   }
 * };
 * ```
 */
const checkEmailAvailability = async (req, res) => {
    const { email } = req.query;

    // Call service layer
    const result = await userService.checkEmailAvailability(email);

    // Send response
    sendSuccess(
        res,
        result.message,
        {
            available: result.available,
        },
        null,
        STATUS_CODES.OK
    );
};

// ========================================
// EXPORTS
// ========================================

export default {   // check here - a inconsistency in export style 
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    getCurrentUser,
    getUserById,
    updateUserProfile,
    changePassword,
    checkEmailAvailability,
};