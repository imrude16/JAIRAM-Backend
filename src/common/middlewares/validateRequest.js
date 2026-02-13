import AppError from "../errors/AppError.js";

const validateRequest = (schemas) => (req, res, next) => {
    try {
        const fieldsToValidate = ["body", "params", "query"];

        let validationErrors = [];

        for (const field of fieldsToValidate) {
            if (schemas[field]) {
                const { error, value } = schemas[field].validate(req[field], {
                    abortEarly: false,
                    stripUnknown: true,
                });

                if (error) {
                    validationErrors.push(
                        ...error.details.map((err) => ({
                            field: field,
                            message: err.message,
                            path: err.path.join("."),
                        }))
                    );
                } else {
                    // Replace request data with sanitized value
                    req[field] = value;
                }
            }
        }

        if (validationErrors.length > 0) {
            return next(
                new AppError(
                    "Validation Failed",
                    400,
                    "VALIDATION_ERROR",
                    { errors: validationErrors }
                )
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default validateRequest;
