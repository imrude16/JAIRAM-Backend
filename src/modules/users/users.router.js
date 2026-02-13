import { Router } from "express";
import { requireAuth } from "../../common/middlewares/requireAuth";
import { allowRoles } from "../../common/middlewares/roleBaseMiddleware";
import { ROLES } from "../../common/constants/roles";
import { createUserSchema, getUserByIdSchema } from "./users.validator";
import { validateRequest } from "../../common/middlewares/validateRequest";
import asyncHandler from "../../common/middlewares/asyncHandler";
const router = Router();
import { createUser, getUserById } from "./users.controller";

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
