import * as service from "./loan.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

export const listLoanWorkspace = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.listLoanWorkspace(req.user.id);

    sendSuccess(res, {
      message: "Loan workspace fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createLoanApplication = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.createLoanApplication(req.user.id, req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: "Loan application submitted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
