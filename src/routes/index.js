import { Router } from "express";
const router = Router();

// Import module routes
import userRoutes from "../modules/users/users.router";

// // Register module routes
router.use("/users", userRoutes);


export default router;
