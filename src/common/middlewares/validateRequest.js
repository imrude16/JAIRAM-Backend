import { AppError } from "../errors/AppError.js";

const validateRequest = (schemas) => (req, res, next) => {
    try {
        console.log("🟨 [VALIDATE] Validation started"); // debugger
        
        const fieldsToValidate = ["body", "params", "query"];

        let validationErrors = [];

        for (const field of fieldsToValidate) {
            if (schemas[field]) {
                console.log(`🟨 [VALIDATE] Validating ${field}...`); // debugger
                
                const { error, value } = schemas[field].validate(req[field], {
                    abortEarly: false,
                    stripUnknown: true,
                });

                if (error) {
                    console.log(`❌ [VALIDATE] ${field} validation FAILED:`, error.details); // debugger
                    validationErrors.push(
                        ...error.details.map((err) => ({
                            field: field,
                            message: err.message,
                            path: err.path.join("."),
                        }))
                    );
                } else {
                    console.log(`✅ [VALIDATE] ${field} validation PASSED`); // debugger
                    
                    // For query params, we need to handle differently
                    // because req.query is read-only in Express
                    if (field === 'query') {
                        // Merge validated values back into query
                        Object.keys(value).forEach(key => {
                            req.query[key] = value[key];
                        });
                    } else {
                        // For body and params, direct assignment works
                        req[field] = value;
                    }
                }
            }
        }

        if (validationErrors.length > 0) {
            console.log("❌ [VALIDATE] Validation failed with errors:", validationErrors); // debugger
            return next(
                new AppError(
                    "Validation Failed",
                    400,
                    "VALIDATION_ERROR",
                    { errors: validationErrors }
                )
            );
        }

        console.log("✅ [VALIDATE] All validation passed!"); // debugger
        next();
    } catch (error) {
        console.error("❌ [VALIDATE] Exception caught:", error); // debugger
        next(error);
    }
};

export { validateRequest };