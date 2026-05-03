import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../user/user.model.js";
import Wallet from "../wallet/wallet.model.js";
import Credit from "../credit/credit.model.js";
import Notification from "../notification/notification.model.js";

import ENV from "../../config/env.js";
import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import {
  createId,
  ensureUserDefaults,
  nowIso,
  sanitizeUser,
} from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// TOKEN
const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id || user._id,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: "1d" }
  );

// ================= REGISTER =================
export const registerUser = async (payload) => {
  const fullName = payload.fullName || payload.full_name;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const country = payload.country || "United States";
  const phone = payload.phone || "";

  if (!fullName || !email || !password) {
    throw createHttpError(400, "Full name, email, and password are required");
  }

  // ================= MONGODB =================
  if (isDBConnected()) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: "USER",
      country,
      phone,
    });

    // 🔥 CREATE WALLET
    const wallet = await Wallet.create({
      userId: user._id,
      defaultCurrency: "USD",
      balances: {
        USD: 0,
        EUR: 0,
        INR: 0,
      },
      status: "ACTIVE",
    });

    // 🔥 CREATE CREDIT
    const createdAt = nowIso();

    const credit = await Credit.create({
      userId: user._id,
      score: 700,
      riskLevel: "MEDIUM",
      monthlyVolume: 0,
      transactionCount: 0,
      eligibleLoanAmount: 0,
      createdAt,
      updatedAt: createdAt,
    });

    return {
      user: sanitizeUser(ensureUserDefaults(user.toObject())),
      wallet,
      credit,
      token: generateToken(user),
    };
  }

  // ================= JSON MODE =================
  const state = getState();

  if (state.users.find((u) => u.email === email)) {
    throw createHttpError(409, "User already exists");
  }

  const createdAt = nowIso();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: createId("usr"),
    fullName,
    email,
    passwordHash,
    role: "USER",
    country,
    phone,
    address: payload.address || "",
    occupation: payload.occupation || "",
    accountStatus: "ACTIVE",
    fraudFlag: false,
    adminNote: "",
    kycStatus: "PENDING",
    preferredTransferType: "smart",
    createdAt,
    updatedAt: createdAt,
  };

  let wallet = null;
  let credit = null;

  await updateState((draft) => {
    wallet = {
      id: createId("wal"),
      userId: user.id,
      defaultCurrency: "USD",
      balances: {
        USD: 0,
        EUR: 0,
        INR: 0,
      },
      createdAt,
      updatedAt: createdAt,
    };

    credit = {
      id: createId("crd"),
      userId: user.id,
      score: 700,
      riskLevel: "MEDIUM",
      monthlyVolume: 0,
      transactionCount: 0,
      eligibleLoanAmount: 0,
      lastUpdated: createdAt,
      createdAt,
      updatedAt: createdAt,
    };

    draft.users.push(user);
    draft.wallets.push(wallet);
    draft.credits.push(credit);

    draft.notifications.unshift({
      id: createId("ntf"),
      userId: user.id,
      title: "Welcome to CrossPay",
      message:
        "Your account is created. Complete KYC and start transactions to unlock credit features.",
      type: "system",
      read: false,
      createdAt,
      updatedAt: createdAt,
    });
  });

  return {
    user: sanitizeUser(ensureUserDefaults(user)),
    wallet,
    credit,
    token: generateToken(user),
  };
};

// ================= LOGIN =================
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  if (isDBConnected()) {
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw createHttpError(401, "Invalid credentials");
    }

    return {
      user: sanitizeUser(ensureUserDefaults(user)),
      token: generateToken(user),
    };
  }

  const user = getState().users.find((u) => u.email === normalizedEmail);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw createHttpError(401, "Invalid credentials");
  }

  return {
    user: sanitizeUser(ensureUserDefaults(user)),
    token: generateToken(user),
  };
};

// ================= GET CURRENT USER =================
export const getCurrentUser = async (userId) => {
  if (isDBConnected()) {
    const [user, wallet, credit, unreadNotifications] = await Promise.all([
      User.findById(userId).lean(),
      Wallet.findOne({ userId }).lean(),
      Credit.findOne({ userId }).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return {
      user: sanitizeUser(ensureUserDefaults(user)),
      wallet,
      credit,
      unreadNotifications,
    };
  }

  const state = getState();

  const user = state.users.find((u) => u.id === userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return {
    user: sanitizeUser(ensureUserDefaults(user)),
    wallet: state.wallets.find((w) => w.userId === userId) || null,
    credit: state.credits.find((c) => c.userId === userId) || null,
    unreadNotifications: state.notifications.filter(
      (n) => n.userId === userId && !n.read
    ).length,
  };
};

// ================= LOGOUT =================
export const logoutUser = async () => ({
  message: "Logged out successfully",
});
