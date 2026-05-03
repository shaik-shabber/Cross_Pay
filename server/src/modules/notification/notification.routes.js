import express from "express";
import * as controller from "./notification.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listNotifications);
router.patch("/:notificationId/read", controller.markAsRead);
router.patch("/clear-all", controller.clearAll);

export default router;