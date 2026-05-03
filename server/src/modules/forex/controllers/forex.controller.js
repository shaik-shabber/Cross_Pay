import * as service from "../services/forex.service.js";
import { sendSuccess } from "../../../utils/response.util.js";

// ================= GET RATES =================
export const getRates = async (req, res, next) => {
  try {
    const data = await service.getRatesSnapshot();

    sendSuccess(res, {
      message: "Forex rates fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ================= QUOTE =================
export const getQuoteOptions = async (req, res, next) => {
  try {
    const data = await service.getTransferOptions(req.body);

    sendSuccess(res, {
      message: "Transfer options fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ================= CONVERT =================
export const convertCurrency = async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      throw new Error("amount, from, to are required");
    }

    const options = await service.getTransferOptions({
      amount,
      currencyFrom: from,
      currencyTo: to,
    });

    const best = options.find((o) => o.transferType === "smart");

    sendSuccess(res, {
      message: "Conversion successful",
      data: best,
    });
  } catch (error) {
    next(error);
  }
};