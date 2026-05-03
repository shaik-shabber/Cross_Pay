import mongoose from "mongoose";
import Beneficiary from "./beneficiary.model.js";

import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import { createId, nowIso } from "../../utils/entity.util.js";
import { notifySystem } from "../../utils/notification.helper.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

// ================= HELPERS =================
const clean = (val) =>
  typeof val === "string" ? val.trim() : val;

const upper = (val) => {
  const cleaned = clean(val);
  return typeof cleaned === "string" ? cleaned.toUpperCase() : cleaned;
};

const maskAccountNumber = (accountNumber) => {
  const normalized = clean(accountNumber);

  if (!normalized) {
    return "";
  }

  return `XXXXXX${String(normalized).slice(-4)}`;
};

const normalizePayload = (payload = {}, { includeEmptyEmail = false } = {}) => {
  const normalized = {};

  if ("fullName" in payload) {
    normalized.fullName = clean(payload.fullName);
  }

  if ("bankName" in payload) {
    normalized.bankName = clean(payload.bankName);
  }

  if ("accountNumber" in payload) {
    normalized.accountNumber = clean(payload.accountNumber);
  }

  if ("swiftCode" in payload) {
    normalized.swiftCode = upper(payload.swiftCode);
  }

  if ("country" in payload) {
    normalized.country = upper(payload.country);
  }

  if ("currency" in payload) {
    normalized.currency = upper(payload.currency);
  }

  if ("email" in payload || includeEmptyEmail) {
    normalized.email = clean(payload.email || "");
  }

  return normalized;
};

// ================= LIST =================
export const listBeneficiaries = async (userId) => {
  if (isDBConnected()) {
    return await Beneficiary.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  }

  return getState()
    .beneficiaries.filter(
      (b) => b.userId === userId && b.isActive !== false
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ================= CREATE =================
export const createBeneficiary = async (userId, payload) => {
  const {
    fullName,
    bankName,
    accountNumber,
    swiftCode,
    country,
    currency,
    email,
  } = normalizePayload(payload, { includeEmptyEmail: true });

  if (!fullName || !bankName || !accountNumber || !swiftCode || !country || !currency) {
    throw createHttpError(400, "All beneficiary details are required");
  }

  // ===== MongoDB =====
  if (isDBConnected()) {
    const exists = await Beneficiary.findOne({
      userId,
      accountNumber,
    });

    if (exists) {
      throw createHttpError(409, "Beneficiary already exists");
    }

    const beneficiary = await Beneficiary.create({
      userId,
      fullName,
      email,
      bankName,
      accountNumber,
      swiftCode,
      country,
      currency,
    });

    await notifySystem(
      userId,
      "Beneficiary Added",
      `${fullName} added successfully`
    );

    return beneficiary;
  }

  // ===== FALLBACK STATE =====
  let created = null;
  const timestamp = nowIso();

  await updateState((draft) => {
    const exists = draft.beneficiaries.find(
      (b) => b.userId === userId && b.accountNumber === accountNumber
    );

    if (exists) {
      throw createHttpError(409, "Beneficiary already exists");
    }

    created = {
      id: createId("ben"),
      userId,
      fullName,
      email,
      bankName,
      accountNumber,
      maskedAccountNumber: maskAccountNumber(accountNumber),
      swiftCode,
      country,
      currency,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    draft.beneficiaries.unshift(created);
  });

  await notifySystem(
    userId,
    "Beneficiary Added",
    `${fullName} added successfully`
  );

  return created;
};

// ================= UPDATE =================
export const updateBeneficiary = async (userId, id, payload) => {
  const data = normalizePayload(payload);

  if (isDBConnected()) {
    const beneficiary = await Beneficiary.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!beneficiary) {
      throw createHttpError(404, "Beneficiary not found");
    }

    if (data.accountNumber) {
      const exists = await Beneficiary.findOne({
        userId,
        accountNumber: data.accountNumber,
        _id: { $ne: id },
      });

      if (exists) {
        throw createHttpError(409, "Account already exists");
      }
    }

    Object.assign(beneficiary, data);

    await beneficiary.save();

    await notifySystem(
      userId,
      "Beneficiary Updated",
      `${beneficiary.fullName} updated`
    );

    return beneficiary;
  }

  let updated = null;

  await updateState((draft) => {
    const beneficiary = draft.beneficiaries.find(
      (b) => b.id === id && b.userId === userId && b.isActive !== false
    );

    if (!beneficiary) {
      throw createHttpError(404, "Beneficiary not found");
    }

    if (data.accountNumber) {
      const exists = draft.beneficiaries.find(
        (item) =>
          item.userId === userId &&
          item.id !== id &&
          item.accountNumber === data.accountNumber
      );

      if (exists) {
        throw createHttpError(409, "Account already exists");
      }
    }

    Object.assign(beneficiary, data);

    if (data.accountNumber) {
      beneficiary.maskedAccountNumber = maskAccountNumber(data.accountNumber);
    }

    beneficiary.updatedAt = nowIso();

    updated = beneficiary;
  });

  await notifySystem(
    userId,
    "Beneficiary Updated",
    `${updated.fullName} updated`
  );

  return updated;
};

// ================= DELETE =================
export const deleteBeneficiary = async (userId, id) => {
  if (isDBConnected()) {
    const beneficiary = await Beneficiary.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!beneficiary) {
      throw createHttpError(404, "Beneficiary not found");
    }

    beneficiary.isActive = false;
    await beneficiary.save();

    await notifySystem(
      userId,
      "Beneficiary Removed",
      `${beneficiary.fullName} removed`
    );

    return { success: true };
  }

  await updateState((draft) => {
    const beneficiary = draft.beneficiaries.find(
      (b) => b.id === id && b.userId === userId && b.isActive !== false
    );

    if (!beneficiary) {
      throw createHttpError(404, "Beneficiary not found");
    }

    beneficiary.isActive = false;
    beneficiary.updatedAt = nowIso();
  });

  await notifySystem(
    userId,
    "Beneficiary Removed",
    `Beneficiary removed`
  );

  return { success: true };
};
