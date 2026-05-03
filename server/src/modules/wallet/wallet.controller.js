import * as service from "./wallet.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

export const getWallet = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.getWallet(req.user.id);

    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const topUpWallet = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(createHttpError(400, "Invalid request"));
    }

    const data = await service.topUpWallet(req.user.id, req.body);

    sendSuccess(res, {
      message: "Wallet credited successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawWallet = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(createHttpError(400, "Invalid request"));
    }

    const data = await service.withdrawWallet(req.user.id, req.body);

    sendSuccess(res, {
      message: "Withdrawal successful",
      data,
    });
  } catch (error) {
    next(error);
  }
};