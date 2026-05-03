import { pushNotification } from "../modules/notification/notification.service.js";

// ================= SYSTEM =================
export const notifySystem = async (
  userId,
  message,
  title = "System Update"
) => {
  await pushNotification({
    userId,
    title,
    message,
    type: "system",
  });
};

// ================= TRANSACTION =================
export const notifyTransactionSuccess = async (
  userId,
  amount,
  currency
) => {
  await pushNotification({
    userId,
    title: "Transfer Successful",
    message: `You sent ${amount} ${currency}`,
    type: "transaction",
  });
};

export const notifyTransactionFailed = async (userId) => {
  await pushNotification({
    userId,
    title: "Transaction Failed",
    message: "Your transaction could not be completed",
    type: "transaction",
  });
};

// ================= WALLET =================
export const notifyWalletCredited = async (
  userId,
  amount,
  currency
) => {
  await pushNotification({
    userId,
    title: "Wallet Credited",
    message: `${amount} ${currency} added to your wallet`,
    type: "system",
  });
};

export const notifyWalletDebited = async (
  userId,
  amount,
  currency
) => {
  await pushNotification({
    userId,
    title: "Wallet Debited",
    message: `${amount} ${currency} deducted from your wallet`,
    type: "transaction",
  });
};

// ================= CREDIT =================
export const notifyCreditUpdate = async (userId, score) => {
  await pushNotification({
    userId,
    title: "Credit Score Updated",
    message: `Your credit score is now ${score}`,
    type: "system",
  });
};