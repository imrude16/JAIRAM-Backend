import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { JWT_SECRET_KEY } from "../../config/env.js";

/**
 * OPTIONAL AUTHENTICATION MIDDLEWARE
 * 
 * This middleware is applied globally to all routes.
 * 
 * Purpose:
 * - If user is logged in (has valid token) → decode token and add user info to req.user
 * - If user is NOT logged in (no token) → set req.user = null and continue
 * 
 * This allows routes to work for both logged-in and anonymous users.
 * 
 * Example usage:
 * - Public articles page: Show "Login" button if req.user is null
 * - Public articles page: Show "My Profile" if req.user exists
 * 
 * For routes that REQUIRE authentication, use requireAuth middleware instead.
 */

const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // No token → public route → continue
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET_KEY);

        req.user = decoded;
        next();

    } catch (err) {
        return next(new AppError("Invalid or expired token", 401));
    }
};

export { optionalAuth };