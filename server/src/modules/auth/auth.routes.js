import express from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", controller.register);
router.post("/login", controller.login);

// Protected routes
router.get("/me", authenticate, controller.getMe);
router.post("/logout", authenticate, controller.logout);

export default router;