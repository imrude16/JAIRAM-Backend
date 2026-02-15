import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

/**
 * USER SCHEMA
 * 
 * This schema defines the structure of user documents in MongoDB.
 * It includes fields for authentication, profile, and OTP verification.
 * 
 * Key Features:
 * - Password hashing before saving (security)
 * - Email verification with OTP
 * - Role-based access control
 * - Timestamps for audit trail
 */

const userSchema = new Schema(
    {
        // ========== BASIC INFORMATION ==========
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Don't include password in query results by default
        },

        // ========== PROFESSIONAL INFORMATION ==========
        profession: {
            type: String,
            enum: {
                values: ["DOCTOR", "RESEARCHER", "STUDENT", "OTHER"],
                message: "{VALUE} is not a valid profession",
            },
            required: [true, "Profession is required"],
        },
        primarySpecialty: {
            type: String,
            required: [true, "Primary specialty is required"],
            trim: true,
        },
        institution: {
            type: String,
            required: [true, "Institution is required"],
            trim: true,
        },
        department: {
            type: String,
            trim: true,
        },

        // ========== CONTACT & ADDRESS ==========
        phoneCode: {
            type: String,
            required: [true, "Phone code is required"],
        },
        mobileNumber: {
            type: String,
            required: [true, "Mobile number is required"],
        },
        address: {
            street: { 
                type: String, 
                required: [true, "Street is required"],
                trim: true 
            },
            city: { 
                type: String, 
                required: [true, "City is required"],
                trim: true 
            },
            state: { 
                type: String, 
                required: [true, "State is required"],
                trim: true 
            },
            country: {
                type: String,
                required: [true, "Country is required"],
                trim: true,
            },
            postalCode: { 
                type: String, 
                required: [true, "Postal code is required"],
                trim: true 
            },
        },

        // ========== ROLE & STATUS ==========
        role: {
            type: String,
            enum: {
                values: ["USER", "ADMIN", "EDITOR", "TECHNICAL_REVIEWER", "REVIEWER"],
                message: "{VALUE} is not a valid role",
            },
            default: "USER",
        },

        // ========== EMAIL VERIFICATION ==========
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationOTP: {
            type: String,
            select: false, // Don't expose OTP in queries
        },
        emailVerificationOTPExpires: {
            type: Date,
            select: false, // Don't expose OTP expiry in queries
        },

        // ========== TERMS & CONDITIONS ACCEPTANCE ==========
        termsAccepted: {
            type: Boolean,
            default: false, // User must accept terms and conditions to register
        },

        // ========== ACCOUNT STATUS ==========
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true, 
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                // Remove sensitive fields when converting to JSON
                delete ret.password;
                delete ret.emailVerificationOTP;
                delete ret.emailVerificationOTPExpires;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ========== VIRTUAL PROPERTIES ==========
// Computed property that combines firstName and lastName
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// ========== MIDDLEWARE (HOOKS) ==========
/**
 * PRE-SAVE MIDDLEWARE
 * 
 * This runs BEFORE a document is saved to the database.
 * It hashes the password if it has been modified.
 * 
 * IMPORTANT: In Mongoose 6+, when using async/await, DO NOT use next()
 * Just return or throw errors - Mongoose handles the rest automatically
 * 
 */
userSchema.pre("save", async function () {
    console.log("🔶 [PRE-SAVE] Hook started"); // debugger
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        console.log("🔶 [PRE-SAVE] Password not modified, skipping hash"); // debugger
        return;
    }

    console.log("🔶 [PRE-SAVE] Hashing password..."); // debugger
    
    // Hash the password with bcrypt (10 rounds of salting)
    this.password = await bcrypt.hash(this.password, 10);
    
    console.log("✅ [PRE-SAVE] Password hashed successfully"); // debugger
});

// ========== INSTANCE METHODS ==========
// These methods are available on individual user documents
/**
 * COMPARE PASSWORD METHOD
 * 
 * Used during login to verify if the provided password matches
 * the stored hashed password.
 * 
 * @param {string} candidatePassword - The password provided by user
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log("🔐 [COMPARE-PASSWORD] Comparing passwords"); // debugger
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("🔐 [COMPARE-PASSWORD] Result:", isMatch); // debugger
    return isMatch;
};

/**
 * GENERATE OTP METHOD
 * 
 * Generates a 6-digit OTP and sets expiration (10 minutes from now)
 * 
 * @returns {string} - The generated OTP
 */
userSchema.methods.generateOTP = function () {
    console.log("🔢 [GENERATE-OTP] Generating OTP"); // debugger
    
    // Generate random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP (in production, consider hashing this too)
    this.emailVerificationOTP = otp;
    
    // OTP expires in 10 minutes
    this.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log("🔢 [GENERATE-OTP] OTP generated:", otp); // debugger
    console.log("🔢 [GENERATE-OTP] Expires at:", this.emailVerificationOTPExpires); // debugger
    
    return otp;
};

/**
 * VERIFY OTP METHOD
 * 
 * Checks if the provided OTP matches and hasn't expired
 * 
 * @param {string} otp - The OTP provided by user
 * @returns {boolean} - True if OTP is valid
 */
userSchema.methods.verifyOTP = function (otp) {
    console.log("✔️ [VERIFY-OTP] Verifying OTP"); // debugger
    console.log("✔️ [VERIFY-OTP] Provided OTP:", otp); // debugger
    console.log("✔️ [VERIFY-OTP] Stored OTP:", this.emailVerificationOTP); // debugger
    console.log("✔️ [VERIFY-OTP] Expiry time:", this.emailVerificationOTPExpires); // debugger
    console.log("✔️ [VERIFY-OTP] Current time:", new Date()); // debugger
    
    // Check if OTP matches and hasn't expired
    const isValid = this.emailVerificationOTP === otp;
    const notExpired = this.emailVerificationOTPExpires > Date.now();
    
    console.log("✔️ [VERIFY-OTP] Is valid:", isValid); // debugger
    console.log("✔️ [VERIFY-OTP] Not expired:", notExpired); // debugger
    console.log("✔️ [VERIFY-OTP] Final result:", isValid && notExpired); // debugger
    
    return isValid && notExpired;
};

// ========== STATIC METHODS ==========
// These methods are available on the User model itself
/**
 * FIND BY EMAIL (STATIC METHOD)
 * 
 * Helper method to find user by email with password included
 * (needed for login verification)
 * 
 * @param {string} email - User's email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmail = function (email) {
    console.log("🔍 [FIND-BY-EMAIL] Searching for:", email); // debugger
    return this.findOne({ email }).select("+password");
};

const User = model("User", userSchema);

export { User };