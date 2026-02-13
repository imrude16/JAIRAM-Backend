import AppError from "../errors/AppError.js";

//For Restricted Routes -> 
//-> Because of global already user added -> so if user there then allowed, else reject;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return next(new AppError("Authentication required", 401));
    }
    next();
};

export default requireAuth ;
