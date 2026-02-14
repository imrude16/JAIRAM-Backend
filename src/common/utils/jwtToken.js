import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../../config/env.js";

/**
 * JWT TOKEN UTILITY
 * 
 * Handles JWT token generation for user authentication
 * 
 * Note: jsonwebtoken is a CommonJS package, so we import the default export
 * instead of named exports to avoid ES module compatibility issues
 */

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        JWT_SECRET_KEY,
        { expiresIn: "7d" }
    );
};

export {
    generateToken,
};