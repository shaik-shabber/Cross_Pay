import mongoose from "mongoose";
import Transaction from "./transaction.model.js";
import Wallet from "../wallet/wallet.model.js";
import Credit from "../credit/credit.model.js";
import Beneficiary from "../beneficiary/beneficiary.model.js";

import { getState, updateState } from "../../utils/data/store.js";
import { getTransferOptions } from "../forex/services/forex.service.js";

import {
  notifyTransactionSuccess,
  notifyTransactionFailed,
  notifyCreditUpdate,
} from "../../utils/notification.helper.js";

import { createHttpError } from "../../utils/httpError.js";
import { createId, nowIso, roundCurrency } from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// ================= HELPER =================
const decorateTransaction = (transaction, state) => {
  if (!state) return transaction;

  const beneficiary = state.beneficiaries.find(
    (b) => b.id === transaction.beneficiaryId
  );

  return {
    ...transaction,
    beneficiaryName: beneficiary?.fullName || "Unknown beneficiary",
  };
};

const updateCreditSnapshot = (credit, amountSent, timestamp) => {
  const oldScore = Number(credit.score || 700);

  credit.transactionCount = Number(credit.transactionCount || 0) + 1;
  credit.monthlyVolume = roundCurrency(
    Number(credit.monthlyVolume || 0) + Number(amountSent || 0)
  );
  credit.score = roundCurrency(
    Math.min(950, oldScore + 5 + Number(amountSent || 0) / 500)
  );
  credit.riskLevel =
    credit.score >= 760
      ? "LOW"
      : credit.score >= 680
      ? "MEDIUM"
      : "HIGH";
  credit.eligibleLoanAmount = roundCurrency(
    Math.max(0, (credit.score - 650) * 50)
  );
  credit.lastUpdated = timestamp;
  credit.updatedAt = timestamp;

  return {
    oldScore,
    newScore: credit.score,
  };
};

const runTransferSuccessNotifications = async (
  userId,
  amountSent,
  currencyFrom,
  oldScore,
  newScore
) => {
  try {
    await notifyTransactionSuccess(userId, amountSent, currencyFrom);
  } catch (error) {
    console.warn("Transaction success notification failed:", error.message);
  }

  if (Math.abs(oldScore - newScore) < 20) {
    return;
  }

  try {
    await notifyCreditUpdate(userId, newScore);
  } catch (error) {
    console.warn("Credit update notification failed:", error.message);
  }
};

const runTransferFailureNotification = async (userId) => {
  try {
    await notifyTransactionFailed(userId);
  } catch (error) {
    console.warn("Transaction failure notification failed:", error.message);
  }
};

// ================= LIST =================
export const listTransactions = async (userId, filters = {}) => {
  if (isDBConnected()) {
    const query = { userId };

    if (filters.status) query.status = filters.status;
    if (filters.transferType) query.transferType = filters.transferType;

    return await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  const state = getState();

  let transactions = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (filters.status) {
    transactions = transactions.filter((t) => t.status === filters.status);
  }

  if (filters.transferType) {
    transactions = transactions.filter(
      (t) => t.transferType === filters.transferType
    );
  }

  return transactions.map((t) => decorateTransaction(t, state));
};

// ================= QUOTE =================
export const getQuoteOptions = async (payload) => {
  return getTransferOptions(payload);
};

// ================= CREATE =================
export const createTransaction = async (userId, payload) => {
  const amount = Number(payload.amount || payload.amountSent);
  const currencyFrom = payload.currencyFrom?.toUpperCase();
  const currencyTo = payload.currencyTo?.toUpperCase();
  const beneficiaryId = payload.beneficiaryId;
  const transferType = payload.transferType || "smart";

  if (!amount || !currencyFrom || !currencyTo || !beneficiaryId) {
    throw createHttpError(400, "Invalid transaction data");
  }

  const quoteOptions = await getTransferOptions({
    amount,
    currencyFrom,
    currencyTo,
  });

  const selectedQuote = quoteOptions.find(
    (quote) => quote.transferType === transferType
  );

  if (!selectedQuote) {
    throw createHttpError(400, "Transfer option not available");
  }

  // ================= MONGODB =================
  // Standalone local MongoDB does not support multi-document transactions.
  // Persist the transfer sequentially so demo environments work reliably.
  if (isDBConnected()) {
    let oldScore = 700;
    let newScore = 700;

    try {
      const timestamp = nowIso();

      const beneficiary = await Beneficiary.findOne({
        _id: beneficiaryId,
        userId,
        isActive: true,
      });

      if (!beneficiary) {
        throw createHttpError(404, "Invalid beneficiary");
      }

      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        throw createHttpError(404, "Wallet not found");
      }

      const balance = Number(wallet.balances[currencyFrom] || 0);

      if (balance < selectedQuote.totalDebit) {
        throw createHttpError(400, `Insufficient ${currencyFrom} balance`);
      }

      wallet.balances[currencyFrom] = roundCurrency(
        balance - selectedQuote.totalDebit
      );
      wallet.updatedAt = timestamp;
      await wallet.save();

      const transaction = await Transaction.create({
        userId,
        beneficiaryId,
        beneficiaryName: beneficiary.fullName,
        amountSent: selectedQuote.amountSent,
        amountReceived: selectedQuote.amountReceived,
        currencyFrom,
        currencyTo,
        exchangeRate: selectedQuote.exchangeRate,
        routingPath: selectedQuote.routingPath,
        transferType,
        feeAmount: selectedQuote.feeAmount,
        totalDebit: selectedQuote.totalDebit,
        savingsAmount: selectedQuote.savingsAmount,
        status: "completed",
        completedAt: timestamp,
      });

      let credit = await Credit.findOne({ userId });

      if (!credit) {
        credit = new Credit({ userId });
      }

      ({ oldScore, newScore } = updateCreditSnapshot(
        credit,
        selectedQuote.amountSent,
        timestamp
      ));

      await credit.save();

      await runTransferSuccessNotifications(
        userId,
        selectedQuote.amountSent,
        currencyFrom,
        oldScore,
        newScore
      );

      return transaction;
    } catch (error) {
      await runTransferFailureNotification(userId);
      throw error;
    }
  }

  // ================= FALLBACK =================
  let createdTransaction = null;
  let oldScore = 700;
  let newScore = 700;

  try {
    await updateState((draft) => {
      const beneficiary = draft.beneficiaries.find(
        (b) =>
          b.id === beneficiaryId &&
          b.userId === userId &&
          b.isActive !== false
      );

      if (!beneficiary) {
        throw createHttpError(404, "Invalid beneficiary");
      }

      const wallet = draft.wallets.find((w) => w.userId === userId);

      if (!wallet) {
        throw createHttpError(404, "Wallet not found");
      }

      const balance = Number(wallet.balances[currencyFrom] || 0);

      if (balance < selectedQuote.totalDebit) {
        throw createHttpError(400, `Insufficient ${currencyFrom} balance`);
      }

      const timestamp = nowIso();

      wallet.balances[currencyFrom] = roundCurrency(
        balance - selectedQuote.totalDebit
      );
      wallet.updatedAt = timestamp;

      createdTransaction = {
        id: createId("txn"),
        reference: `CP-${createId("ref").slice(-6).toUpperCase()}`,
        userId,
        beneficiaryId,
        beneficiaryName: beneficiary.fullName,
        amountSent: selectedQuote.amountSent,
        amountReceived: selectedQuote.amountReceived,
        currencyFrom,
        currencyTo,
        exchangeRate: selectedQuote.exchangeRate,
        routingPath: selectedQuote.routingPath,
        transferType,
        feeAmount: selectedQuote.feeAmount,
        totalDebit: selectedQuote.totalDebit,
        savingsAmount: selectedQuote.savingsAmount,
        status: "completed",
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: timestamp,
      };

      draft.transactions.unshift(createdTransaction);

      let credit = draft.credits.find((item) => item.userId === userId);

      if (!credit) {
        credit = {
          id: createId("crd"),
          userId,
          score: 700,
          riskLevel: "MEDIUM",
          monthlyVolume: 0,
          transactionCount: 0,
          eligibleLoanAmount: 0,
          lastUpdated: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        draft.credits.push(credit);
      }

      ({ oldScore, newScore } = updateCreditSnapshot(
        credit,
        selectedQuote.amountSent,
        timestamp
      ));
    });
  } catch (error) {
    await runTransferFailureNotification(userId);
    throw error;
  }

  await runTransferSuccessNotifications(
    userId,
    selectedQuote.amountSent,
    currencyFrom,
    oldScore,
    newScore
  );

  return decorateTransaction(createdTransaction, getState());
};
