import { randomUUID } from "crypto";

export const createId = (prefix) =>
  `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

export const nowIso = () => new Date().toISOString();

export const roundCurrency = (value) =>
  Number(Number(value).toFixed(2));

export const sanitizeUser = (user) => {
  if (!user) return null;

  const { passwordHash, password, ...safeUser } = user;
  return safeUser;
};

export const ensureUserDefaults = (user = {}) => ({
  accountStatus: "ACTIVE",
  fraudFlag: false,
  adminNote: "",
  address: "",
  occupation: "",
  kycStatus: "VERIFIED",
  preferredTransferType: "smart",
  ...user,
});