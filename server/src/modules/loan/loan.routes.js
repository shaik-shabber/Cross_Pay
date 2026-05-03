import express from "express";
import * as controller from "./loan.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.listLoanWorkspace);
router.post("/", controller.createLoanApplication);

export default router;
