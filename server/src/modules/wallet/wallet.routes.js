import express from "express";
import * as controller from "./wallet.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getWallet);
router.post("/topup", controller.topUpWallet);
router.post("/withdraw", controller.withdrawWallet);

export default router;