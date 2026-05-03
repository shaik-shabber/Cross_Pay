import mongoose from "mongoose";
import User from "./user.model.js";
import Wallet from "../wallet/wallet.model.js";
import Credit from "../credit/credit.model.js";
import Transaction from "../transaction/transaction.model.js";
import Beneficiary from "../beneficiary/beneficiary.model.js";
import Notification from "../notification/notification.model.js";
import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import {
  ensureUserDefaults,
  sanitizeUser,
  roundCurrency,
  nowIso,
} from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

const findUserById = async (id) => {
  if (isDBConnected()) {
    const user = await User.findById(id).lean();
    return user ? sanitizeUser(user) : null;
  }
  return getState().users.find((user) => user.id === id) || null;
};

const buildTransferMix = (transactions) => {
  const summary = {
    instant: 0,
    smart: 0,
    best_rate: 0,
  };

  transactions.forEach((transaction) => {
    summary[transaction.transferType] =
      (summary[transaction.transferType] || 0) + 1;
  });

  return summary;
};

const withBeneficiaryNames = async (transactions) => {
  const beneficiaryIds = [
    ...new Set(
      transactions
        .map((transaction) => transaction.beneficiaryId?.toString())
        .filter(Boolean)
    ),
  ];

  if (!beneficiaryIds.length) {
    return transactions;
  }

  const beneficiaries = await Beneficiary.find({
    _id: { $in: beneficiaryIds },
  }).lean();

  const namesById = new Map(
    beneficiaries.map((beneficiary) => [
      beneficiary._id.toString(),
      beneficiary.fullName,
    ])
  );

  return transactions.map((transaction) => ({
    ...transaction,
    beneficiaryName:
      transaction.beneficiaryName ||
      namesById.get(transaction.beneficiaryId?.toString()) ||
      "Unknown recipient",
  }));
};

export const getProfile = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  // MongoDB MODE
  if (isDBConnected()) {
    const [
      wallet,
      credit,
      beneficiaries,
      transactions,
      transactionCount,
      recentNotifications,
      unreadNotifications,
    ] = await Promise.all([
      Wallet.findOne({ userId }).lean(),
      Credit.findOne({ userId }).lean(),
      Beneficiary.find({ userId, isActive: true }).lean(),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Transaction.countDocuments({ userId }),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return {
      user: sanitizeUser(ensureUserDefaults(user)),
      wallet,
      credit,
      stats: {
        beneficiaries: beneficiaries.length,
        transactions: transactionCount,
        unreadNotifications,
      },
      recentTransactions: await withBeneficiaryNames(transactions),
      recentNotifications,
    };
  }

  // JSON MODE
  const state = getState();

  const transactions = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const notifications = state.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const beneficiaries = state.beneficiaries.filter(
    (b) => b.userId === userId
  );

  return {
    user: sanitizeUser(ensureUserDefaults(user)),
    wallet: state.wallets.find((w) => w.userId === userId) || null,
    credit: state.credits.find((c) => c.userId === userId) || null,
    stats: {
      beneficiaries: beneficiaries.length,
      transactions: transactions.length,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    },
    recentTransactions: transactions.slice(0, 5),
    recentNotifications: notifications.slice(0, 5),
  };
};

export const getDashboard = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  // MongoDB MODE
  if (isDBConnected()) {
    const [
      wallet,
      credit,
      beneficiaries,
      transactions,
      recentNotifications,
      unreadNotifications,
    ] = await Promise.all([
      Wallet.findOne({ userId }).lean(),
      Credit.findOne({ userId }).lean(),
      Beneficiary.find({ userId, isActive: true }).lean(),
      Transaction.find({ userId }).sort({ createdAt: -1 }).lean(),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);

    const completedTransactions = transactions.filter(
      (transaction) => transaction.status === "completed"
    );

    const totalVolume = roundCurrency(
      completedTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amountSent || 0),
        0
      )
    );

    const totalFeesSaved = roundCurrency(
      completedTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.savingsAmount || 0),
        0
      )
    );

    return {
      user: sanitizeUser(ensureUserDefaults(user)),
      wallet,
      credit,
      stats: {
        beneficiaries: beneficiaries.length,
        totalTransactions: transactions.length,
        completedTransactions: completedTransactions.length,
        totalVolume,
        totalFeesSaved,
        unreadNotifications,
      },
      transferMix: buildTransferMix(completedTransactions),
      recentTransactions: await withBeneficiaryNames(transactions.slice(0, 6)),
      recentNotifications,
    };
  }

  // JSON MODE
  const state = getState();

  const wallet = state.wallets.find((w) => w.userId === userId) || null;
  const credit = state.credits.find((c) => c.userId === userId) || null;

  const beneficiaries = state.beneficiaries.filter(
    (b) => b.userId === userId
  );

  const transactions = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const notifications = state.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalVolume = roundCurrency(
    transactions.reduce((sum, t) => sum + t.amountSent, 0)
  );

  const totalFeesSaved = roundCurrency(
    transactions.reduce((sum, t) => sum + (t.savingsAmount || 0), 0)
  );

  return {
    user: sanitizeUser(ensureUserDefaults(user)),
    wallet,
    credit,
    stats: {
      beneficiaries: beneficiaries.length,
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(
        (t) => t.status === "completed"
      ).length,
      totalVolume,
      totalFeesSaved,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    },
    transferMix: buildTransferMix(transactions),
    recentTransactions: transactions.slice(0, 6),
    recentNotifications: notifications.slice(0, 5),
  };
};

export const updateProfile = async (userId, payload) => {
  const allowedFields = [
    "fullName",
    "country",
    "phone",
    "address",
    "occupation",
    "preferredTransferType",
  ];

  // MongoDB MODE
  if (isDBConnected()) {
    const updateData = {};

    allowedFields.forEach((field) => {
      if (typeof payload[field] === "string") {
        updateData[field] = payload[field].trim();
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).lean();

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return {
      user: sanitizeUser(ensureUserDefaults(user)),
    };
  }

  // JSON MODE
  let updatedUser = null;

  await updateState((draft) => {
    const user = draft.users.find((u) => u.id === userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    allowedFields.forEach((field) => {
      if (typeof payload[field] === "string") {
        user[field] = payload[field].trim();
      }
    });

    user.updatedAt = nowIso();
    updatedUser = ensureUserDefaults(user);
  });

  return getProfile(updatedUser.id);
};
