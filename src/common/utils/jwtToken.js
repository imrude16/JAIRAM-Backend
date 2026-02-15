import jwt from "jsonwebtoken";

import { JWT_SECRET_KEY } from "../../config/env.js";

// Handles JWT token generation for user authentication
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