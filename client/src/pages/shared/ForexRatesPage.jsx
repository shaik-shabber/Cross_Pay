import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import api, { getErrorMessage, getPayload } from "../../lib/api";
import { formatMoney, humanizeTransferType } from "../../lib/formatters";

const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "INR", label: "Indian Rupee" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CHF", label: "Swiss Franc" },
];

const BOARD_PRIORITY = ["INR", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"];
const INITIAL_FORM = {
  amount: "1000",
  currencyFrom: "USD",
  currencyTo: "INR",
};

const PAGE_COPY = {
  public: {
    eyebrow: "Public Forex Desk",
    title: "Check live forex rates before you send money",
    description:
      "Compare instant, smart, and best-rate quotes without starting a transfer. This board is open to visitors, users, and admins.",
  },
  user: {
    eyebrow: "Forex Rates",
    title: "Compare live rates without opening the send-money flow",
    description:
      "Review live market corridors and quote options first, then move into a transfer only when you are ready.",
  },
  admin: {
    eyebrow: "Admin Forex Monitor",
    title: "Track live forex rates outside the transfer workflow",
    description:
      "Give operations teams a fast way to review current corridors, pricing, and quote behavior without entering a transaction.",
  },
};

const getAlternateCurrency = (currentCode) =>
  CURRENCY_OPTIONS.find((currency) => currency.code !== currentCode)?.code || "USD";

const formatRate = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 10 ? 2 : 4,
    maximumFractionDigits: value >= 10 ? 2 : 4,
  }).format(Number(value || 0));

const getBoardPairs = (pairs = []) => {
  const prioritized = BOARD_PRIORITY.map((code) =>
    pairs.find((pair) => pair.toCurrency === code)
  ).filter(Boolean);
  const remainder = pairs.filter((pair) => !BOARD_PRIORITY.includes(pair.toCurrency));

  return [...prioritized, ...remainder].slice(0, 8);
};

const renderAction = (audience) => {
  if (audience === "public") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link className="secondary-button" to="/">
          Login
        </Link>
        <Link className="primary-button" to="/register">
          Create Account
        </Link>
      </div>
    );
  }

  if (audience === "admin") {
    return (
      <Link className="secondary-button" to="/admin/transactions">
        Review Transfers
      </Link>
    );
  }

  return (
    <Link className="primary-button" to="/send">
      Continue to Send Money
    </Link>
  );
};

export default function ForexRatesPage({ audience = "user" }) {
  const copy = PAGE_COPY[audience] || PAGE_COPY.user;
  const [form, setForm] = useState(INITIAL_FORM);
  const [marketSnapshot, setMarketSnapshot] = useState({ base: "USD", pairs: [] });
  const [quotes, setQuotes] = useState([]);
  const [marketError, setMarketError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  const loadMarketSnapshot = async () => {
    setMarketError("");
    setIsMarketLoading(true);

    try {
      const response = await api.get("/forex/rates");
      const data = getPayload(response) || { base: "USD", pairs: [] };
      setMarketSnapshot(data);
      setUpdatedAt(new Date().toISOString());
    } catch (error) {
      setMarketError(getErrorMessage(error));
    } finally {
      setIsMarketLoading(false);
    }
  };

  const loadQuotes = async (nextForm = form) => {
    setQuoteError("");
    setIsQuoteLoading(true);

    try {
      const response = await api.post("/forex/quote", {
        amount: Number(nextForm.amount),
        currencyFrom: nextForm.currencyFrom,
        currencyTo: nextForm.currencyTo,
      });
      setQuotes(getPayload(response) || []);
    } catch (error) {
      setQuoteError(getErrorMessage(error));
      setQuotes([]);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    loadMarketSnapshot();
    loadQuotes(INITIAL_FORM);
  }, []);

  const handleCurrencyChange = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "currencyFrom" && value === current.currencyTo) {
        next.currencyTo = getAlternateCurrency(value);
      }

      if (field === "currencyTo" && value === current.currencyFrom) {
        next.currencyFrom = getAlternateCurrency(value);
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadQuotes();
  };

  const preferredQuote = quotes.find((quote) => quote.transferType === "smart") || quotes[0];
  const boardPairs = getBoardPairs(marketSnapshot.pairs);
  const stats = [
    {
      label: "Live Corridors",
      value: marketSnapshot.pairs.length || 0,
      icon: "L",
      hint: "USD market board",
    },
    {
      label: "Selected Pair",
      value: `${form.currencyFrom} -> ${form.currencyTo}`,
      accent: "warning",
      icon: "P",
      hint: "Quote-ready corridor",
    },
    {
      label: "Smart Quote",
      value: preferredQuote
        ? formatMoney(preferredQuote.amountReceived, preferredQuote.currencyTo)
        : "Loading...",
      accent: "success",
      icon: "Q",
      hint: preferredQuote
        ? `For ${formatMoney(form.amount, form.currencyFrom)}`
        : "Fetching live quote",
    },
    {
      label: "Last Refresh",
      value: updatedAt
        ? new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date(updatedAt))
        : "Pending",
      accent: "violet",
      icon: "R",
      hint: "Snapshot timestamp",
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={renderAction(audience)}
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="section-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Live market board</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">USD base corridors</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Use this board for a quick view, then compare a full quote for any pair on
                the right.
              </p>
            </div>
            <button className="secondary-button" onClick={loadMarketSnapshot} type="button">
              Refresh Rates
            </button>
          </div>

          {marketError ? (
            <div className="mt-6 rounded-[1.35rem] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {marketError}
            </div>
          ) : null}

          {isMarketLoading ? (
            <div className="soft-card mt-6 text-sm font-semibold text-slate-500">
              Loading live forex corridors...
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {boardPairs.map((pair) => (
                <div className="metric-card" key={`${pair.fromCurrency}-${pair.toCurrency}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                        {pair.fromCurrency} / {pair.toCurrency}
                      </p>
                      <p className="mt-3 text-2xl font-extrabold text-ink">
                        {formatRate(pair.rate)}
                      </p>
                    </div>
                    <span className="pill">Live</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    1 {pair.fromCurrency} = {formatRate(pair.rate)} {pair.toCurrency}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="section-card" onSubmit={handleSubmit}>
          <p className="text-sm font-bold text-slate-500">Quick comparison</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Check a live quote</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
            Compare what the recipient gets before you create a transfer.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-slate-700">
              Amount
              <input
                className="input-field mt-2"
                min="1"
                type="number"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Send currency
              <select
                className="input-field mt-2"
                value={form.currencyFrom}
                onChange={(event) => handleCurrencyChange("currencyFrom", event.target.value)}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Receive currency
              <select
                className="input-field mt-2"
                value={form.currencyTo}
                onChange={(event) => handleCurrencyChange("currencyTo", event.target.value)}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-[1.5rem] border bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-500">Current smart route preview</p>
            {preferredQuote ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-500">Exchange rate</span>
                  <span className="font-extrabold text-ink">
                    {formatRate(preferredQuote.exchangeRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-500">Recipient gets</span>
                  <span className="font-extrabold text-emerald-600">
                    {formatMoney(preferredQuote.amountReceived, preferredQuote.currencyTo)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-500">Settlement</span>
                  <span className="font-extrabold text-ink">
                    {preferredQuote.settlementText}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Submit a pair to load the latest quote.
              </p>
            )}
          </div>

          <button className="primary-button mt-6 w-full" disabled={isQuoteLoading} type="submit">
            {isQuoteLoading ? "Checking rates..." : "Compare Live Rates"}
          </button>
        </form>
      </section>

      <section className="section-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">Transfer options</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Instant vs smart vs best rate</h2>
          </div>
          {preferredQuote ? (
            <span className="pill">
              Best default: {humanizeTransferType(preferredQuote.transferType)}
            </span>
          ) : null}
        </div>

        {quoteError ? (
          <div className="mt-6 rounded-[1.35rem] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {quoteError}
          </div>
        ) : null}

        {isQuoteLoading ? (
          <div className="soft-card mt-6 text-sm font-semibold text-slate-500">
            Loading quote options...
          </div>
        ) : quotes.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {quotes.map((quote) => (
              <div
                className={`metric-card ${preferredQuote?.transferType === quote.transferType ? "ring-2 ring-brand" : ""}`}
                key={quote.transferType}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-500">
                    {humanizeTransferType(quote.transferType)}
                  </p>
                  <span className="pill">
                    {quote.currencyFrom} {"->"} {quote.currencyTo}
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-ink">
                  {formatMoney(quote.amountReceived, quote.currencyTo)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Recipient receives
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500">Fee</span>
                    <span className="font-extrabold text-ink">
                      {formatMoney(quote.feeAmount, quote.currencyFrom)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500">Total debit</span>
                    <span className="font-extrabold text-ink">
                      {formatMoney(quote.totalDebit, quote.currencyFrom)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500">Settlement</span>
                    <span className="font-extrabold text-ink">{quote.settlementText}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-500">Savings</span>
                    <span className="font-extrabold text-emerald-600">
                      {formatMoney(quote.savingsAmount, quote.currencyFrom)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="soft-card mt-6 text-sm font-semibold text-slate-500">
            No quote options available for the selected pair yet.
          </div>
        )}
      </section>

      {audience === "public" ? (
        <section className="wallet-hero">
          <p className="text-sm font-bold text-white/80">Ready when you are</p>
          <h2 className="mt-3 text-3xl font-extrabold">
            Explore rates first, then sign in only if you want to transfer.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/80">
            This page is designed for visitors, users, and admins who only want to
            monitor live forex pricing without entering the send-money flow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="secondary-button border-0" to="/">
              Back to Login
            </Link>
            <Link className="primary-button bg-white/15 shadow-none hover:bg-white/20" to="/register">
              Open an Account
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
