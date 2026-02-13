import { sign } from "jsonwebtoken";
import { JWT_SECRET } from "../../config/env";
const generateToken = (user) => {
    return sign(
        {
            id: user._id,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
};

export default {
    generateToken
};
