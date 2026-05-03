import mongoose from "mongoose";
import User from "../user/user.model.js";
import Wallet from "../wallet/wallet.model.js";
import Credit from "../credit/credit.model.js";
import Transaction from "../transaction/transaction.model.js";
import Beneficiary from "../beneficiary/beneficiary.model.js";
import Notification from "../notification/notification.model.js";
import Loan from "../loan/loan.model.js";
import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import {
  createId,
  ensureUserDefaults,
  nowIso,
  roundCurrency,
  sanitizeUser,
} from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

const entityId = (entity) => entity?.id || entity?._id?.toString();
const sameId = (left, right) => String(left || "") === String(right || "");

const userWalletTotal = (wallet = {}) =>
  roundCurrency(
    Object.values(wallet.balances || {}).reduce(
      (sum, amount) => sum + Number(amount || 0),
      0
    )
  );

const transferMix = (transactions = []) => {
  const mix = { instant: 0, smart: 0, best_rate: 0 };

  transactions.forEach((transaction) => {
    const key = transaction.transferType || "smart";
    mix[key] = (mix[key] || 0) + 1;
  });

  return mix;
};

const decorateTransactions = (transactions, users, beneficiaries) => {
  const usersById = new Map(users.map((user) => [entityId(user), user]));
  const beneficiariesById = new Map(
    beneficiaries.map((beneficiary) => [entityId(beneficiary), beneficiary])
  );

  return transactions.map((transaction) => {
    const user = usersById.get(String(transaction.userId));
    const beneficiary = beneficiariesById.get(String(transaction.beneficiaryId));

    return {
      ...transaction,
      userName: user?.fullName || "Unknown user",
      userEmail: user?.email || "",
      userStatus: user?.accountStatus || "ACTIVE",
      beneficiaryName:
        transaction.beneficiaryName ||
        beneficiary?.fullName ||
        "Unknown beneficiary",
      riskFlag: transaction.riskFlag || "Normal",
    };
  });
};

const decorateUsers = (users, wallets, credits, transactions, beneficiaries, notifications, loans) =>
  users.map((user) => {
    const id = entityId(user);
    const wallet = wallets.find((item) => sameId(item.userId, id)) || null;
    const credit = credits.find((item) => sameId(item.userId, id)) || null;
    const userTransactions = transactions.filter((item) => sameId(item.userId, id));
    const completedTransactions = userTransactions.filter(
      (item) => item.status === "completed"
    );

    return {
      ...sanitizeUser(ensureUserDefaults(user)),
      id,
      wallet,
      credit,
      totalBalance: userWalletTotal(wallet),
      totalSent: roundCurrency(
        completedTransactions.reduce(
          (sum, transaction) => sum + Number(transaction.amountSent || 0),
          0
        )
      ),
      transactionCount: userTransactions.length,
      beneficiaries: beneficiaries.filter((item) => sameId(item.userId, id)).length,
      unreadAlerts: notifications.filter((item) => sameId(item.userId, id) && !item.read).length,
      loans: loans.filter((item) => sameId(item.userId, id)).length,
      lastActive: userTransactions[0]?.createdAt || user.updatedAt || user.createdAt,
    };
  });

const buildUserWorkspace = (collections) =>
  decorateUsers(
    collections.users,
    collections.wallets,
    collections.credits,
    collections.transactions,
    collections.beneficiaries,
    collections.notifications,
    collections.loans
  ).filter((user) => user.role !== "ADMIN");

const buildUserDetail = (userId, collections) => {
  const users = buildUserWorkspace(collections);
  const user = users.find((item) => sameId(entityId(item), userId));

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const transactions = decorateTransactions(
    collections.transactions.filter((item) => sameId(item.userId, user.id)),
    collections.users,
    collections.beneficiaries
  );
  const beneficiaries = collections.beneficiaries.filter((item) =>
    sameId(item.userId, user.id)
  );
  const notifications = collections.notifications.filter((item) =>
    sameId(item.userId, user.id)
  );
  const loans = collections.loans.filter((item) => sameId(item.userId, user.id));

  return {
    user,
    transactions,
    beneficiaries,
    notifications,
    loans,
  };
};

const summarize = ({ users, wallets, credits, transactions, loans }) => {
  const customerUsers = users.filter((user) => user.role !== "ADMIN");
  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === "completed"
  );
  const totalCredit = credits.reduce(
    (sum, credit) => sum + Number(credit.score || 0),
    0
  );

  return {
    revenue: roundCurrency(
      completedTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.feeAmount || 0),
        0
      )
    ),
    totalUsers: customerUsers.length,
    activeUsers: customerUsers.filter((user) => user.accountStatus !== "SUSPENDED").length,
    completedVolume: roundCurrency(
      completedTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amountSent || 0),
        0
      )
    ),
    avgCreditScore: credits.length ? Math.round(totalCredit / credits.length) : 0,
    pendingTransfers: transactions.filter((transaction) =>
      ["pending", "processing"].includes(transaction.status)
    ).length,
    pendingLoans: loans.filter((loan) => loan.status === "pending").length,
    approvedLoans: loans.filter((loan) => loan.status === "approved").length,
    pendingLoanAmount: roundCurrency(
      loans
        .filter((loan) => loan.status === "pending")
        .reduce((sum, loan) => sum + Number(loan.amount || 0), 0)
    ),
    suspiciousTransfers: transactions.filter(
      (transaction) => transaction.riskFlag === "Suspicious" || Number(transaction.amountSent || 0) > 10000
    ).length,
    walletHoldings: roundCurrency(
      wallets.reduce((sum, wallet) => sum + userWalletTotal(wallet), 0)
    ),
    highRiskAccounts: credits.filter((credit) => credit.riskLevel === "HIGH").length,
  };
};

const loadCollections = async () => {
  if (isDBConnected()) {
    const [users, wallets, credits, transactions, beneficiaries, notifications, loans] =
      await Promise.all([
        User.find().sort({ createdAt: -1 }).lean(),
        Wallet.find().lean(),
        Credit.find().lean(),
        Transaction.find().sort({ createdAt: -1 }).lean(),
        Beneficiary.find().lean(),
        Notification.find().sort({ createdAt: -1 }).lean(),
        Loan.find().sort({ createdAt: -1 }).lean(),
      ]);

    return { users, wallets, credits, transactions, beneficiaries, notifications, loans };
  }

  const state = getState();
  return {
    users: state.users,
    wallets: state.wallets,
    credits: state.credits,
    transactions: state.transactions,
    beneficiaries: state.beneficiaries,
    notifications: state.notifications,
    loans: state.loans,
  };
};

export const getOverview = async () => {
  const collections = await loadCollections();
  const users = decorateUsers(
    collections.users,
    collections.wallets,
    collections.credits,
    collections.transactions,
    collections.beneficiaries,
    collections.notifications,
    collections.loans
  );
  const decoratedTransactions = decorateTransactions(
    collections.transactions,
    collections.users,
    collections.beneficiaries
  );

  return {
    stats: summarize(collections),
    transferMix: transferMix(collections.transactions),
    recentUsers: users.filter((user) => user.role !== "ADMIN").slice(0, 5),
    flaggedTransactions: decoratedTransactions.filter(
      (transaction) => transaction.riskFlag === "Suspicious" || Number(transaction.amountSent || 0) > 10000
    ),
  };
};

export const listUsers = async () => {
  const collections = await loadCollections();
  const users = buildUserWorkspace(collections);

  return {
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.accountStatus === "ACTIVE").length,
      prioritySenders: users.filter((user) => Number(user.totalSent || 0) >= 10000).length,
      underReview: users.filter((user) => user.fraudFlag).length,
    },
    users,
  };
};

export const getUserDetails = async (userId) => {
  const collections = await loadCollections();
  return buildUserDetail(userId, collections);
};

export const updateUser = async (userId, payload) => {
  const allowedFields = [
    "fullName",
    "email",
    "country",
    "phone",
    "address",
    "occupation",
    "accountStatus",
    "kycStatus",
    "preferredTransferType",
    "adminNote",
    "fraudFlag",
  ];

  const cleanPayload = {};

  allowedFields.forEach((field) => {
    if (typeof payload[field] === "string") {
      cleanPayload[field] =
        field === "email" ? payload[field].trim().toLowerCase() : payload[field].trim();
    } else if (typeof payload[field] === "boolean") {
      cleanPayload[field] = payload[field];
    }
  });

  if (isDBConnected()) {
    const user = await User.findByIdAndUpdate(userId, cleanPayload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return sanitizeUser(ensureUserDefaults(user));
  }

  let updatedUser = null;
  await updateState((draft) => {
    const user = draft.users.find((item) => sameId(item.id, userId));

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    Object.assign(user, cleanPayload, { updatedAt: nowIso() });
    updatedUser = sanitizeUser(ensureUserDefaults(user));
  });

  return updatedUser;
};

export const listTransactions = async () => {
  const collections = await loadCollections();
  const transactions = decorateTransactions(
    collections.transactions,
    collections.users,
    collections.beneficiaries
  );

  return {
    stats: {
      suspicious: transactions.filter((item) => item.riskFlag === "Suspicious").length,
      highValue: transactions.filter((item) => Number(item.amountSent || 0) > 10000).length,
      pendingQueue: transactions.filter((item) =>
        ["pending", "processing"].includes(item.status)
      ).length,
    },
    transactions,
  };
};

export const listCreditProfiles = async () => {
  const collections = await loadCollections();
  const users = buildUserWorkspace(collections);
  const profiles = users.map((user) => ({
    user,
    credit: user.credit || {
      score: 700,
      riskLevel: "MEDIUM",
      monthlyVolume: 0,
      transactionCount: 0,
      eligibleLoanAmount: 0,
    },
  }));

  return {
    stats: {
      averageScore: profiles.length
        ? Math.round(
            profiles.reduce((sum, item) => sum + Number(item.credit.score || 0), 0) /
              profiles.length
          )
        : 0,
      lowRisk: profiles.filter((item) => item.credit.riskLevel === "LOW").length,
      priorityProfiles: profiles.filter(
        (item) => Number(item.credit.eligibleLoanAmount || 0) >= 5000
      ).length,
      highRisk: profiles.filter((item) => item.credit.riskLevel === "HIGH").length,
    },
    profiles,
  };
};

export const updateCreditProfile = async (userId, payload) => {
  const update = {};

  if (payload.score !== undefined) {
    update.score = Math.min(1000, Math.max(0, Number(payload.score)));
  }
  if (typeof payload.riskLevel === "string") {
    update.riskLevel = payload.riskLevel.toUpperCase();
  }
  if (payload.eligibleLoanAmount !== undefined) {
    update.eligibleLoanAmount = roundCurrency(Number(payload.eligibleLoanAmount || 0));
  }
  if (typeof payload.adminNote === "string") {
    update.adminNote = payload.adminNote.trim();
  }
  update.lastUpdated = nowIso();

  if (isDBConnected()) {
    const credit = await Credit.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean();

    return credit;
  }

  let updated = null;
  await updateState((draft) => {
    let credit = draft.credits.find((item) => sameId(item.userId, userId));

    if (!credit) {
      credit = {
        id: createId("crd"),
        userId,
        score: 700,
        riskLevel: "MEDIUM",
        monthlyVolume: 0,
        transactionCount: 0,
        eligibleLoanAmount: 0,
        createdAt: nowIso(),
      };
      draft.credits.push(credit);
    }

    Object.assign(credit, update, { updatedAt: nowIso() });
    updated = credit;
  });

  return updated;
};

export const listLoans = async () => {
  const collections = await loadCollections();
  const usersById = new Map(collections.users.map((user) => [entityId(user), user]));
  const loans = collections.loans.map((loan) => {
    const user = usersById.get(String(loan.userId));

    return {
      ...loan,
      userName: user?.fullName || "Unknown user",
      userEmail: user?.email || "",
    };
  });

  return {
    stats: {
      pendingLoans: loans.filter((loan) => loan.status === "pending").length,
      approvedLoans: loans.filter((loan) => loan.status === "approved").length,
      rejectedLoans: loans.filter((loan) => loan.status === "rejected").length,
      pendingAmount: roundCurrency(
        loans
          .filter((loan) => loan.status === "pending")
          .reduce((sum, loan) => sum + Number(loan.amount || 0), 0)
      ),
    },
    loans,
  };
};

export const getLoanDetails = async (loanId) => {
  const collections = await loadCollections();
  const usersById = new Map(collections.users.map((user) => [entityId(user), user]));
  const loan = collections.loans.find((item) => sameId(entityId(item), loanId));

  if (!loan) {
    throw createHttpError(404, "Loan not found");
  }

  const userDetail = buildUserDetail(loan.userId, collections);
  const user = usersById.get(String(loan.userId));

  return {
    loan: {
      ...loan,
      id: entityId(loan),
      userName: user?.fullName || userDetail.user.fullName || "Unknown user",
      userEmail: user?.email || userDetail.user.email || "",
    },
    user: userDetail.user,
    transactions: userDetail.transactions,
    beneficiaries: userDetail.beneficiaries,
    notifications: userDetail.notifications,
    relatedLoans: userDetail.loans,
  };
};

export const updateLoan = async (loanId, payload) => {
  const update = {};

  if (typeof payload.status === "string") {
    update.status = payload.status.toLowerCase();
  }
  if (typeof payload.adminNote === "string") {
    update.adminNote = payload.adminNote.trim();
  }

  if (isDBConnected()) {
    const loan = await Loan.findByIdAndUpdate(loanId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!loan) {
      throw createHttpError(404, "Loan not found");
    }

    return loan;
  }

  let updated = null;
  await updateState((draft) => {
    const loan = draft.loans.find((item) => sameId(item.id, loanId));

    if (!loan) {
      throw createHttpError(404, "Loan not found");
    }

    Object.assign(loan, update, { updatedAt: nowIso() });
    updated = loan;
  });

  return updated;
};

export const getNotificationsWorkspace = async () => {
  const { users, notifications } = await loadCollections();
  const customerUsers = users.filter((user) => user.role !== "ADMIN");

  return {
    stats: {
      users: customerUsers.length,
      activeUsers: customerUsers.filter((user) => user.accountStatus !== "SUSPENDED").length,
      reviewStatus: customerUsers.filter((user) => user.fraudFlag).length,
    },
    users: customerUsers.map((user) => sanitizeUser(ensureUserDefaults(user))),
    recentNotifications: notifications.slice(0, 8),
  };
};

export const sendNotification = async (payload) => {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const targetUserId = payload.userId || payload.specificUser || "all";

  if (!title || !message) {
    throw createHttpError(400, "Title and message are required");
  }

  if (isDBConnected()) {
    const query = targetUserId === "all" ? { role: "USER" } : { _id: targetUserId };
    const users = await User.find(query).lean();

    if (!users.length) {
      throw createHttpError(404, "No matching users found");
    }

    const notifications = await Notification.create(
      users.map((user) => ({
        userId: user._id,
        title,
        message,
        type: payload.type || "system",
      }))
    );

    return { sent: notifications.length };
  }

  let sent = 0;
  const timestamp = nowIso();

  await updateState((draft) => {
    const users =
      targetUserId === "all"
        ? draft.users.filter((user) => user.role === "USER")
        : draft.users.filter((user) => sameId(user.id, targetUserId));

    if (!users.length) {
      throw createHttpError(404, "No matching users found");
    }

    users.forEach((user) => {
      draft.notifications.unshift({
        id: createId("ntf"),
        userId: user.id,
        title,
        message,
        type: payload.type || "system",
        read: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      sent += 1;
    });
  });

  return { sent };
};

export const getReports = async () => {
  const collections = await loadCollections();
  const stats = summarize(collections);
  const completedTransactions = collections.transactions.filter(
    (transaction) => transaction.status === "completed"
  );
  const byDate = new Map();

  completedTransactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt).toISOString().slice(0, 10);
    const current = byDate.get(date) || { date, revenue: 0, volume: 0 };
    current.revenue += Number(transaction.feeAmount || 0);
    current.volume += Number(transaction.amountSent || 0);
    byDate.set(date, current);
  });

  return {
    stats,
    transferMix: transferMix(completedTransactions),
    trends: Array.from(byDate.values()).map((item) => ({
      ...item,
      revenue: roundCurrency(item.revenue),
      volume: roundCurrency(item.volume),
    })),
    riskSignals: collections.transactions.filter(
      (transaction) => transaction.riskFlag === "Suspicious"
    ),
    watchlist: collections.users.filter((user) => user.fraudFlag),
  };
};
