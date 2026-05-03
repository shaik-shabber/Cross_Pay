import express from "express";
import * as controller from "./credit.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getCreditProfile);
router.get("/summary", controller.getCreditSummary);

export default router;