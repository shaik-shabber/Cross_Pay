import express from "express";
import * as controller from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/profile", controller.getProfile);
router.patch("/profile", controller.updateProfile);
router.get("/dashboard", controller.getDashboard);

export default router;