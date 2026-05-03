import mongoose from "mongoose";
import Credit from "./credit.model.js";

import { updateState, getState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import { createId, nowIso, roundCurrency } from "../../utils/entity.util.js";

import { notifyCreditUpdate } from "../../utils/notification.helper.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// ================= HELPERS =================

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const getRiskLevel = (score) => {
  if (score >= 760) return "LOW";
  if (score >= 680) return "MEDIUM";
  return "HIGH";
};

// ================= CREDIT CALCULATION =================

const calculateCredit = (transactions) => {
  const completed = transactions.filter((t) => t.status === "completed");
  const failed = transactions.filter((t) => t.status === "failed");

  const monthlyVolume = roundCurrency(
    completed.reduce((sum, t) => sum + t.amountSent, 0)
  );

  const transactionCount = completed.length;

  const score = clamp(
    700 +
      transactionCount * 8 +
      monthlyVolume / 220 -
      failed.length * 20,
    300,
    950
  );

  const riskLevel = getRiskLevel(score);

  const eligibleLoanAmount = roundCurrency(
    Math.max(0, (score - 620) * 45)
  );

  return {
    score,
    riskLevel,
    monthlyVolume,
    transactionCount,
    eligibleLoanAmount,
  };
};

// ================= GET CREDIT PROFILE =================

export const getCreditProfile = async (userId) => {
  // ===== MongoDB =====
  if (isDBConnected()) {
    const profile = await Credit.findOne({ userId }).lean();

    if (!profile) {
      throw createHttpError(404, "Credit profile not found");
    }

    return profile;
  }

  // ===== JSON FALLBACK =====
  let profile = null;

  await updateState(async (draft) => {
    const user = draft.users.find((u) => u.id === userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const transactions = draft.transactions.filter(
      (t) => t.userId === userId
    );

    const calculated = calculateCredit(transactions);

    let credit = draft.credits.find((c) => c.userId === userId);

    const timestamp = nowIso();

    if (!credit) {
      credit = {
        id: createId("crd"),
        userId,
        createdAt: timestamp,
      };
      draft.credits.push(credit);
    }

    const oldScore = credit.score || 700;

    Object.assign(credit, {
      ...calculated,
      lastUpdated: timestamp,
      updatedAt: timestamp,
    });

    profile = credit;

    // 🔥 NOTIFICATION (USING HELPER)
    if (Math.abs(oldScore - calculated.score) >= 20) {
      await notifyCreditUpdate(userId, calculated.score);
    }
  });

  return profile;
};

// ================= RECOMPUTE CREDIT =================

export const recomputeCredit = async (userId) => {
  // ===== MongoDB =====
  if (isDBConnected()) {
    const credit = await Credit.findOne({ userId }).lean();

    if (!credit) {
      throw createHttpError(404, "Credit profile not found");
    }

    return credit;
  }

  // ===== FALLBACK =====
  return getCreditProfile(userId);
};