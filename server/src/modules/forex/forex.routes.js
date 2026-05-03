import express from "express";
import * as controller from "./controllers/forex.controller.js";

const router = express.Router();

// ================= RATES =================
router.get("/rates", controller.getRates);

// ================= CONVERT =================
router.post("/convert", controller.convertCurrency);

// ================= QUOTE =================
router.post("/quote", controller.getQuoteOptions);

// ✅ THIS FIXES YOUR ERROR
export default router;