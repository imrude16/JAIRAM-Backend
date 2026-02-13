import Joi from "joi";

export const createUserSchema = {
    body: Joi.object({
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("USER", "ADMIN").optional(),
    }),
};

export const getUsersSchema = {
    query: Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
        search: Joi.string().optional(),
    }),
};

export const getUserByIdSchema = {
    params: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
};
