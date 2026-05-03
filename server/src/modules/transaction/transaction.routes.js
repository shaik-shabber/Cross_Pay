import express from "express";
import * as controller from "./transaction.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 All transaction routes require login
router.use(authenticate);

// ================= ROUTES =================

// Get all transactions
router.get("/", controller.listTransactions);

// Get transfer quote options
router.post("/quote", controller.getQuoteOptions);

// Create transaction
router.post("/", controller.createTransaction);

export default router;