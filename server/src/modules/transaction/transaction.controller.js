import * as service from "./transaction.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

// ================= LIST =================
export const listTransactions = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.listTransactions(req.user.id, req.query);

    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

// ================= QUOTE =================
export const getQuoteOptions = async (req, res, next) => {
  try {
    const { amount, currencyFrom, currencyTo } = req.body;

    if (!amount || !currencyFrom || !currencyTo) {
      return next(
        createHttpError(400, "Amount, currencyFrom and currencyTo are required")
      );
    }

    const data = await service.getQuoteOptions(req.body);

    sendSuccess(res, {
      message: "Transfer options fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ================= CREATE =================
export const createTransaction = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(createHttpError(401, "Unauthorized"));
    }

    const data = await service.createTransaction(req.user.id, req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: "Transaction created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};