import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useTransaction } from "../../context/TransactionContext";
import api, { getErrorMessage, getPayload } from "../../lib/api";
import { formatMoney, getEntityId, humanizeTransferType } from "../../lib/formatters";

export default function SendMoney() {
  const { quotes, getQuotes, createTransaction } = useTransaction();
  const { refreshSession } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ amount: "1000", currencyFrom: "USD" });
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);

  useEffect(() => {
    const loadBeneficiaries = async () => {
      const response = await api.get("/beneficiaries");
      setBeneficiaries(getPayload(response) || []);
    };

    loadBeneficiaries();
  }, []);

  useEffect(() => {
    if (!showCelebration) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowCelebration(false);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [showCelebration]);

  const selectedBeneficiary = useMemo(
    () => beneficiaries.find((beneficiary) => getEntityId(beneficiary) === selectedId),
    [beneficiaries, selectedId]
  );

  const handleQuotes = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBeneficiary) {
      setError("Select a beneficiary before comparing quotes.");
      return;
    }

    try {
      const data = await getQuotes({
        amount: Number(form.amount),
        currencyFrom: form.currencyFrom,
        currencyTo: selectedBeneficiary.currency,
      });
      setSelectedQuote(data.find((quote) => quote.transferType === "smart") || data[0]);
      setStep(2);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleTransfer = async () => {
    setError("");

    try {
      await createTransaction({
        beneficiaryId: selectedId,
        amount: Number(form.amount),
        currencyFrom: form.currencyFrom,
        currencyTo: selectedBeneficiary.currency,
        transferType: selectedQuote.transferType,
      });
      await refreshSession();
      setSuccess("Transfer completed and your wallet has been updated.");
      setCelebrationKey((current) => current + 1);
      setShowCelebration(true);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-7">
      {showCelebration ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]">
          <div className="celebration-shell surface-card w-full max-w-sm p-6 text-center" key={celebrationKey}>
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <span className="celebration-ring absolute inset-0 rounded-full border border-brand/20" />
              <span className="celebration-ring celebration-ring-delay absolute inset-3 rounded-full border border-emerald-300/40" />
              <div className="celebration-plane flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-brand to-cyan-400 text-2xl text-white shadow-soft">
                $
              </div>
            </div>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
              Transfer sent
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">
              Money is on the way
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Your transfer has been completed and the notification center has been refreshed.
            </p>
          </div>
        </div>
      ) : null}

      <PageHeader
        title="Transfer funds internationally with the best rates"
        description="Move through recipient setup, quote comparison, and final review in one guided flow."
        action={<Link className="secondary-button" to="/dashboard">Back to Dashboard</Link>}
      />

      <section className="section-card">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((number) => (
            <div className="flex items-center gap-4" key={number}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold ${step >= number ? "bg-brand text-white" : "bg-slate-100 text-slate-400"}`}>
                {number}
              </span>
              {number < 3 ? <span className="h-1 w-12 rounded-full bg-slate-200 sm:w-20" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <p className="text-sm font-bold text-slate-500">Step {step}</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">
          {step === 1 ? "Select a beneficiary" : step === 2 ? "Compare transfer quotes" : "Transfer complete"}
        </h2>

        {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
        {success ? <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</div> : null}

        {step === 1 ? (
          <form className="mt-6 grid gap-6 lg:grid-cols-2" onSubmit={handleQuotes}>
            <div className="space-y-5">
              <label className="block text-sm font-bold text-slate-700">
                Beneficiary
                <select className="input-field mt-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                  <option value="">Choose saved beneficiary</option>
                  {beneficiaries.map((beneficiary) => (
                    <option key={getEntityId(beneficiary)} value={getEntityId(beneficiary)}>
                      {beneficiary.fullName} - {beneficiary.bankName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Amount
                  <input className="input-field mt-2" min="1" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Send From
                  <select className="input-field mt-2" value={form.currencyFrom} onChange={(event) => setForm({ ...form, currencyFrom: event.target.value })}>
                    {["USD", "EUR", "INR", "GBP"].map((currency) => <option key={currency}>{currency}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-bold text-slate-700">
                Receive Currency
                <input className="input-field mt-2" disabled value={selectedBeneficiary?.currency || "Select a beneficiary first"} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link className="secondary-button" to="/beneficiaries">Manage Beneficiaries</Link>
                <button className="primary-button" type="submit">Continue to Quotes</button>
              </div>
            </div>

            <div className="soft-card">
              <p className="text-sm font-bold text-slate-500">Recipient preview</p>
              {selectedBeneficiary ? (
                <div className="mt-6 space-y-3">
                  <h3 className="text-2xl font-extrabold text-ink">{selectedBeneficiary.fullName}</h3>
                  <p className="text-sm font-semibold text-slate-500">{selectedBeneficiary.bankName}</p>
                  <p className="text-sm font-semibold text-slate-500">{selectedBeneficiary.country}</p>
                  <span className="pill">{selectedBeneficiary.currency}</span>
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-2xl font-extrabold text-ink">No beneficiary selected</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    Choose a saved beneficiary, or add a new payout profile from the beneficiaries page first.
                  </p>
                </div>
              )}
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {quotes.map((quote) => (
                <button
                  className={`metric-card text-left ${selectedQuote?.transferType === quote.transferType ? "ring-2 ring-brand" : ""}`}
                  key={quote.transferType}
                  onClick={() => setSelectedQuote(quote)}
                  type="button"
                >
                  <p className="text-sm font-bold text-slate-500">{humanizeTransferType(quote.transferType)}</p>
                  <p className="mt-3 text-2xl font-extrabold text-ink">{formatMoney(quote.amountReceived, quote.currencyTo)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Fee {formatMoney(quote.feeAmount, quote.currencyFrom)}</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">Saves {formatMoney(quote.savingsAmount, quote.currencyFrom)}</p>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="secondary-button flex-1" onClick={() => setStep(1)} type="button">Back</button>
              <button className="primary-button flex-1" onClick={handleTransfer} type="button">Send Transfer</button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link className="secondary-button" to="/transactions">View History</Link>
            <button className="primary-button" onClick={() => { setStep(1); setSuccess(""); setShowCelebration(false); }} type="button">Send Another</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
