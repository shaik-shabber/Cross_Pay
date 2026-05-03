import { createHttpError } from "../../../utils/httpError.js";
import { roundCurrency } from "../../../utils/entity.util.js";

import { listPairs, getDirectRate, getRateGraph } from "./rate.service.js";
import { getDirectRoute, getBestRoute } from "./routing.service.js";
import { getTransferProfile } from "./timing.service.js";

// ================= SNAPSHOT =================
export const getRatesSnapshot = async () => {
  const pairs = await listPairs("USD");

  return {
    base: "USD",
    pairs,
  };
};

// ================= NORMALIZE =================
const normalizeQuote = ({
  amount,
  currencyFrom,
  currencyTo,
  transferType,
  route,
  profile,
}) => {
  const exchangeRate = Number(
    (route.rate * profile.rateMultiplier).toFixed(6)
  );

  const feeAmount = roundCurrency(amount * profile.feeRate);
  const amountReceived = roundCurrency(amount * exchangeRate);
  const totalDebit = roundCurrency(amount + feeAmount);

  return {
    transferType,
    amountSent: amount,
    amountReceived,
    currencyFrom,
    currencyTo,
    exchangeRate,
    feeAmount,
    totalDebit,
    routingPath: route.path,
    routingLabel: route.path.join(" -> "),
    settlementText: profile.settlementText,
    savingsAmount: 0,
  };
};

// ================= BUILD QUOTE =================
const buildQuote = async ({
  amount,
  currencyFrom,
  currencyTo,
  transferType,
}) => {
  if (!amount || amount <= 0) {
    throw createHttpError(400, "Invalid amount");
  }

  if (!currencyFrom || !currencyTo) {
    throw createHttpError(400, "Currencies required");
  }

  const profile = getTransferProfile(transferType);

  const from = currencyFrom.toUpperCase();
  const to = currencyTo.toUpperCase();

  const directRate = await getDirectRate(from, to);
  const graph = await getRateGraph(from);

  const route = directRate
    ? getDirectRoute(directRate, from, to)
    : getBestRoute(graph, from, to);

  if (!route) {
    throw createHttpError(400, `No route available for ${from} → ${to}`);
  }

  return normalizeQuote({
    amount,
    currencyFrom: from,
    currencyTo: to,
    transferType,
    route,
    profile,
  });
};

// ================= OPTIONS =================
export const getTransferOptions = async ({
  amount,
  currencyFrom,
  currencyTo,
}) => {
  const types = ["instant", "smart", "best_rate"];

  const options = await Promise.all(
    types.map((type) =>
      buildQuote({
        amount,
        currencyFrom,
        currencyTo,
        transferType: type,
      })
    )
  );

  const instant = options.find((o) => o.transferType === "instant");

  return options.map((o) => ({
    ...o,
    savingsAmount:
      o.transferType === "instant"
        ? 0
        : roundCurrency(
            Math.max(
              0,
              o.amountReceived -
                instant.amountReceived +
                (instant.feeAmount - o.feeAmount)
            )
          ),
  }));
};