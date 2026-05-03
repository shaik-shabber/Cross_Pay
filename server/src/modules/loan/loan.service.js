import mongoose from "mongoose";
import Loan from "./loan.model.js";
import Credit from "../credit/credit.model.js";
import { getState, updateState } from "../../utils/data/store.js";
import { createHttpError } from "../../utils/httpError.js";
import { createId, nowIso, roundCurrency } from "../../utils/entity.util.js";

const isDBConnected = () => mongoose.connection.readyState === 1;

const buildOffers = (credit = {}) => {
  const score = Number(credit.score || 700);
  const limit = Number(credit.eligibleLoanAmount || Math.max(0, (score - 620) * 45));

  return [
    {
      id: "offer_personal",
      name: "Personal Loan",
      badge: "Best for you",
      amount: roundCurrency(Math.max(1000, limit * 0.4)),
      interestRate: score >= 740 ? 8.5 : 9.8,
      tenureMonths: 12,
      score,
    },
    {
      id: "offer_express",
      name: "Express Loan",
      badge: "Quick approval",
      amount: roundCurrency(Math.max(750, limit * 0.25)),
      interestRate: score >= 740 ? 10 : 11.2,
      tenureMonths: 6,
      score,
    },
    {
      id: "offer_premium",
      name: "Premium Loan",
      badge: "Low interest",
      amount: roundCurrency(Math.max(1500, limit)),
      interestRate: score >= 740 ? 7.2 : 8.4,
      tenureMonths: 24,
      score,
    },
  ];
};

export const listLoanWorkspace = async (userId) => {
  if (isDBConnected()) {
    const [credit, loans] = await Promise.all([
      Credit.findOne({ userId }).lean(),
      Loan.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    return {
      credit,
      offers: buildOffers(credit),
      applications: loans,
    };
  }

  const state = getState();
  const credit = state.credits.find((item) => item.userId === userId) || {
    score: 700,
    eligibleLoanAmount: 3600,
  };

  return {
    credit,
    offers: buildOffers(credit),
    applications: state.loans
      .filter((loan) => loan.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
};

export const createLoanApplication = async (userId, payload) => {
  const amount = Number(payload.amount);
  const tenureMonths = Number(payload.tenureMonths || payload.tenure || 12);
  const purpose = typeof payload.purpose === "string" ? payload.purpose.trim() : "";

  if (!amount || amount <= 0 || !purpose) {
    throw createHttpError(400, "Loan amount and purpose are required");
  }

  if (isDBConnected()) {
    const credit = await Credit.findOne({ userId }).lean();
    const interestRate = Number(credit?.score || 700) >= 740 ? 9.4 : 10.9;

    return await Loan.create({
      userId,
      amount,
      purpose,
      tenureMonths,
      interestRate,
      status: "pending",
    });
  }

  let created = null;
  const timestamp = nowIso();

  await updateState((draft) => {
    created = {
      id: createId("lon"),
      userId,
      amount,
      purpose,
      tenureMonths,
      interestRate: 10.9,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    draft.loans.unshift(created);
  });

  return created;
};
