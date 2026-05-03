import express from "express";
import * as controller from "./beneficiary.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 Protect all routes
router.use(authenticate);

// ================= ROUTES =================

// GET all beneficiaries
router.get("/", controller.listBeneficiaries);

// CREATE new beneficiary
router.post("/", controller.createBeneficiary);

// UPDATE beneficiary
router.patch("/:id", controller.updateBeneficiary);

// DELETE (soft delete)
router.delete("/:id", controller.deleteBeneficiary);

export default router;