import { Router } from "express";
import requireAuth  from "../../common/middlewares/requireAuth.js";
import allowRoles from "../../common/middlewares/roleBaseMiddleware.js";
import ROLES from "../../common/constants/roles.js";
import { createUserSchema, getUserByIdSchema } from "./users.validator.js";
import validateRequest  from "../../common/middlewares/validateRequest.js";
import asyncHandler from "../../common/middlewares/asyncHandler.js";
import userController from "./users.controller.js";

const { createUser, getUserById } = userController;

const router = Router();

router.post(
    "/",
    validateRequest(createUserSchema),
    asyncHandler(createUser)
);

router.get(
    "/",
    requireAuth,
    validateRequest(getUserByIdSchema),
    asyncHandler(getUserById)
);

export default router;
