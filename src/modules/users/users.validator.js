import Joi from "joi";

/**
 * VALIDATION SCHEMAS USING JOI
 * 
 * Joi is a validation library that ensures incoming data meets our requirements
 * BEFORE it reaches the database or business logic.
 * 
 * Benefits:
 * - Catches invalid data early
 * - Provides clear error messages
 * - Sanitizes input (removes unknown fields)
 * - Prevents injection attacks
 */

// ========== REGISTER USER SCHEMA ==========
/**
 * Validates data when a user registers
 * 
 * This is used in Step 1 of registration (before OTP is sent)
 */
export const registerUserSchema = {
    body: Joi.object({
        // ========== BASIC INFORMATION ==========
        firstName: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
                "string.min": "First name must be at least 2 characters",
                "string.max": "First name cannot exceed 50 characters",
                "any.required": "First name is required",
            }),

        lastName: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
                "string.min": "Last name must be at least 2 characters",
                "string.max": "Last name cannot exceed 50 characters",
                "any.required": "Last name is required",
            }),

        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),

        password: Joi.string()
            .min(6)
            .max(100)
            .required()
            .messages({
                "string.min": "Password must be at least 6 characters",
                "any.required": "Password is required",
            }),

        confirmPassword: Joi.string()
            .valid(Joi.ref("password"))
            .required()
            .messages({
                "any.only": "Passwords do not match",
                "any.required": "Please confirm your password",
            }),

        // ========== PROFESSIONAL INFORMATION ==========
        profession: Joi.string()
            .valid("DOCTOR", "RESEARCHER", "STUDENT", "OTHER")
            .required()
            .messages({
                "any.only": "Please select a valid profession",
                "any.required": "Profession is required",
            }),

        primarySpecialty: Joi.string()
            .trim()
            .required()
            .messages({
                "any.required": "Primary specialty is required",
            }),

        institution: Joi.string()
            .trim()
            .required()
            .messages({
                "any.required": "Institution is required",
            }),

        department: Joi.string()
            .trim()
            .optional()
            .allow(""),

        // ========== CONTACT INFORMATION ==========
        phoneCode: Joi.string()
            .required()
            .messages({
                "any.required": "Phone code is required",
            }),

        mobileNumber: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required()
            .messages({
                "string.pattern.base": "Mobile number must be 10 digits",
                "any.required": "Mobile number is required",
            }),

        // ========== ADDRESS (ALL FIELDS INCLUDED) ==========
        address: Joi.object({
            street: Joi.string()
                .trim()
                .required()
                .messages({
                    "any.required": "Street address is required",
                }),

            city: Joi.string()
                .trim()
                .required()
                .messages({
                    "any.required": "City is required",
                }),

            state: Joi.string()
                .trim()
                .required()
                .messages({
                    "any.required": "State is required",
                }),

            country: Joi.string()
                .trim()
                .required()
                .messages({
                    "any.required": "Country is required",
                }),

            postalCode: Joi.string()
                .trim()
                .required()
                .messages({
                    "any.required": "Postal code is required",
                }),
        }).required(),

        // ========== TERMS & CONDITIONS ACCEPTANCE ==========
        termsAccepted: Joi.boolean()
            .valid(true)
            .required()
            .messages({
                "any.only": "You must accept the terms and conditions to register",
                "any.required": "You must accept the terms and conditions to register",
            }),
    }),
};

// ========== VERIFY OTP SCHEMA ==========
/**
 * Validates OTP verification request
 * 
 * This is used in Step 2 of registration (after OTP is sent to email)
 */
export const verifyOTPSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),

        otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
                "string.length": "OTP must be exactly 6 digits",
                "string.pattern.base": "OTP must contain only numbers",
                "any.required": "OTP is required",
            }),
    }),
};

// ========== RESEND OTP SCHEMA ==========
/**
 * Validates request to resend OTP
 */
export const resendOTPSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),
    }),
};

// ========== LOGIN SCHEMA ==========
/**
 * Validates user login credentials
 */
export const loginUserSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),

        password: Joi.string()
            .required()
            .messages({
                "any.required": "Password is required",
            }),
    }),
};

// ========== GET USER BY ID SCHEMA ==========
/**
 * Validates request to get user by ID
 */
export const getUserByIdSchema = {
    params: Joi.object({
        id: Joi.string()
            .hex()
            .length(24)
            .required()
            .messages({
                "string.hex": "Invalid user ID format",
                "string.length": "Invalid user ID format",
                "any.required": "User ID is required",
            }),
    }),
};

// ========== UPDATE USER SCHEMA ==========
/**
 * Validates user profile update
 * 
 * Note: Password and email cannot be updated through this endpoint
 */
export const updateUserSchema = {
    params: Joi.object({
        id: Joi.string()
            .hex()
            .length(24)
            .optional() // ID is optional because /me route doesn't have it
            .messages({
                "string.hex": "Invalid user ID format",
                "string.length": "Invalid user ID format",
                "any.required": "User ID is required",
            }),
    }),

    body: Joi.object({
        // Basic Information
        firstName: Joi.string().min(2).max(50).trim().optional(),
        lastName: Joi.string().min(2).max(50).trim().optional(),

        // Professional Information
        profession: Joi.string()
            .valid("DOCTOR", "RESEARCHER", "STUDENT", "OTHER")
            .optional(),
        primarySpecialty: Joi.string().trim().optional(),
        institution: Joi.string().trim().optional(),
        department: Joi.string().trim().optional().allow(""),

        // Contact Information
        phoneCode: Joi.string().optional(),
        mobileNumber: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .optional(),

        // Address (all fields optional for updates)
        address: Joi.object({
            street: Joi.string().trim().optional(),
            city: Joi.string().trim().optional(),
            state: Joi.string().trim().optional(),
            country: Joi.string().trim().optional(),
            postalCode: Joi.string().trim().optional(),
        }).optional(),
    })
        .min(1) // At least one field must be present
        .messages({
            "object.min": "At least one field must be provided for update",
        }),
};

// ========== CHANGE PASSWORD SCHEMA ==========
/**
 * Validates password change request
 */
export const changePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                "any.required": "Current password is required",
            }),

        newPassword: Joi.string()
            .min(6)
            .max(100)
            .required()
            .invalid(Joi.ref("currentPassword"))
            .messages({
                "string.min": "New password must be at least 6 characters",
                "any.required": "New password is required",
                "any.invalid": "New password must be different from current password",
            }),

        confirmNewPassword: Joi.string()
            .valid(Joi.ref("newPassword"))
            .required()
            .messages({
                "any.only": "Passwords do not match",
                "any.required": "Please confirm your new password",
            }),
    }),
};

// ========== FORGOT PASSWORD SCHEMA ==========
/**
 * Validates forgot password request (sends reset link)
 */
export const forgotPasswordSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),
    }),
};

// ========== RESET PASSWORD SCHEMA ==========
/**
 * Validates password reset with token
 */
export const resetPasswordSchema = {
    body: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                "any.required": "Reset token is required",
            }),

        newPassword: Joi.string()
            .min(6)
            .max(100)
            .required()
            .messages({
                "string.min": "Password must be at least 6 characters",
                "any.required": "New password is required",
            }),

        confirmNewPassword: Joi.string()
            .valid(Joi.ref("newPassword"))
            .required()
            .messages({
                "any.only": "Passwords do not match",
                "any.required": "Please confirm your new password",
            }),
    }),
};

// ========== CHECK EMAIL AVAILABILITY SCHEMA ==========
/**
 * Validates email availability check
 * 
 * THIS IS THE KEY TO SOLVING YOUR UX PROBLEM!
 * 
 * Use this endpoint BEFORE the user submits the full registration form.
 * Call it when user types email or on blur event.
 */
export const checkEmailSchema = {
    query: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                "string.email": "Please provide a valid email address",
                "any.required": "Email is required",
            }),
    }),
};