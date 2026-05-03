import mongoose from "mongoose";
import Wallet from "./wallet.model.js";

import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import { nowIso, roundCurrency } from "../../utils/entity.util.js";

import {
  notifyWalletCredited,
  notifyWalletDebited,
} from "../../utils/notification.helper.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// ================= GET WALLET =================
export const getWallet = async (userId) => {
  if (isDBConnected()) {
    const wallet = await Wallet.findOne({ userId }).lean();

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    return wallet;
  }

  const wallet = getState().wallets.find((w) => w.userId === userId);

  if (!wallet) {
    throw createHttpError(404, "Wallet not found");
  }

  return wallet;
};

// ================= TOP UP =================
export const topUpWallet = async (userId, payload) => {
  const currency = payload.currency?.toUpperCase();
  const amount = Number(payload.amount);

  if (!currency || Number.isNaN(amount) || amount <= 0) {
    throw createHttpError(400, "Valid currency and amount required");
  }

  // ===== MongoDB =====
  if (isDBConnected()) {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    wallet.balances[currency] =
      roundCurrency((wallet.balances[currency] || 0) + amount);

    wallet.updatedAt = nowIso();
    await wallet.save();

    await notifyWalletCredited(userId, amount, currency);

    return wallet;
  }

  // ===== JSON =====
  let updatedWallet = null;
  const timestamp = nowIso();

  await updateState(async (draft) => {
    const wallet = draft.wallets.find((w) => w.userId === userId);

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    wallet.balances[currency] =
      roundCurrency((wallet.balances[currency] || 0) + amount);

    wallet.updatedAt = timestamp;
    updatedWallet = wallet;

    await notifyWalletCredited(userId, amount, currency);
  });

  return updatedWallet;
};

// ================= WITHDRAW =================
export const withdrawWallet = async (userId, payload) => {
  const currency = payload.currency?.toUpperCase();
  const amount = Number(payload.amount);

  if (!currency || Number.isNaN(amount) || amount <= 0) {
    throw createHttpError(400, "Valid currency and amount required");
  }

  // ===== MongoDB =====
  if (isDBConnected()) {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    const currentBalance = wallet.balances[currency] || 0;

    if (currentBalance < amount) {
      throw createHttpError(400, "Insufficient balance");
    }

    wallet.balances[currency] =
      roundCurrency(currentBalance - amount);

    wallet.updatedAt = nowIso();
    await wallet.save();

    await notifyWalletDebited(userId, amount, currency);

    return wallet;
  }

  // ===== JSON =====
  let updatedWallet = null;
  const timestamp = nowIso();

  await updateState(async (draft) => {
    const wallet = draft.wallets.find((w) => w.userId === userId);

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    const currentBalance = wallet.balances[currency] || 0;

    if (currentBalance < amount) {
      throw createHttpError(400, "Insufficient balance");
    }

    wallet.balances[currency] =
      roundCurrency(currentBalance - amount);

    wallet.updatedAt = timestamp;
    updatedWallet = wallet;

    await notifyWalletDebited(userId, amount, currency);
  });

  return updatedWallet;
};