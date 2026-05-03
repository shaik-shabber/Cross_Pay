import * as service from "./credit.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

// ================= GET CREDIT PROFILE =================
export const getCreditProfile = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.getCreditProfile(req.user.id);

    sendSuccess(res, {
      message: "Credit profile fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET CREDIT SUMMARY (OPTIONAL BUT USEFUL) =================
export const getCreditSummary = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const credit = await service.getCreditProfile(req.user.id);

    const summary = {
      score: credit.score,
      riskLevel: credit.riskLevel,
      eligibleLoanAmount: credit.eligibleLoanAmount,
    };

    sendSuccess(res, {
      message: "Credit summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};