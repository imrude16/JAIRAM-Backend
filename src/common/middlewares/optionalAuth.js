import { verify } from "jsonwebtoken";
import AppError from "../errors/AppError";

//Optional Auth to be use at global level -> 
// -> If User loggedIn get UserInfo add into req object;
// -> If not loggedIn then allow to go next;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // No token → public route → continue
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (err) {
        return next(new AppError("Invalid or expired token", 401));
    }
};

export default optionalAuth;
