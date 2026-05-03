import express from "express";
import * as controller from "./admin.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/overview", controller.getOverview);
router.get("/stats", controller.getOverview);
router.get("/users", controller.listUsers);
router.get("/users/:userId", controller.getUserDetails);
router.patch("/users/:userId", controller.updateUser);
router.get("/transactions", controller.listTransactions);
router.get("/credit", controller.listCreditProfiles);
router.patch("/credit/:userId", controller.updateCreditProfile);
router.get("/loans", controller.listLoans);
router.get("/loans/:loanId", controller.getLoanDetails);
router.patch("/loans/:loanId", controller.updateLoan);
router.get("/notifications", controller.getNotificationsWorkspace);
router.post("/notifications", controller.sendNotification);
router.get("/reports", controller.getReports);

export default router;
