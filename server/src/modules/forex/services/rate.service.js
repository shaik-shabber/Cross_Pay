import axios from "axios";
import {getCache,setCache} from "../../../utils/forex.cache.js";
import { createHttpError } from "../../../utils/httpError.js";

const API_URL = "https://api.exchangerate-api.com/v4/latest";

// ================= NORMALIZE =================
const normalizeCurrency = (currency) =>
  typeof currency === "string" ? currency.toUpperCase() : null;

// ================= GET RATE GRAPH =================
export const getRateGraph = async (base = "USD") => {
  const normalizedBase = normalizeCurrency(base);

  if (!normalizedBase) {
    throw createHttpError(400, "Base currency is required");
  }

  const cached = getCache(normalizedBase);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${API_URL}/${normalizedBase}`);

    if (!data || !data.rates) {
      throw createHttpError(500, "Invalid forex API response");
    }

    const graph = {
      [normalizedBase]: data.rates,
    };

    setCache(normalizedBase, graph);

    return graph;
  } catch (error) {
    throw createHttpError(
      500,
      `Failed to fetch forex rates for ${normalizedBase}`
    );
  }
};

// ================= DIRECT RATE =================
export const getDirectRate = async (from, to) => {
  const fromCurrency = normalizeCurrency(from);
  const toCurrency = normalizeCurrency(to);

  if (!fromCurrency || !toCurrency) {
    throw createHttpError(400, "Invalid currency pair");
  }

  const graph = await getRateGraph(fromCurrency);

  const rate = graph[fromCurrency]?.[toCurrency];

  return rate || null; // fallback handled in routing
};

// ================= LIST PAIRS =================
export const listPairs = async (base = "USD") => {
  const normalizedBase = normalizeCurrency(base);

  const graph = await getRateGraph(normalizedBase);

  const rates = graph[normalizedBase];

  return Object.entries(rates).map(([toCurrency, rate]) => ({
    fromCurrency: normalizedBase,
    toCurrency,
    rate,
  }));
};