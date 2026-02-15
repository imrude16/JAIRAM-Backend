import jwt from "jsonwebtoken";

import { AppError } from "../errors/AppError.js";
import { JWT_SECRET_KEY } from "../../config/env.js";


// This middleware is applied globally to all routes.
// This allows routes to work for both logged-in and anonymous users.
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