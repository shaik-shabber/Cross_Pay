import { useEffect, useState } from "react";

import PageHeader from "../../components/PageHeader";
import api, { getErrorMessage, getPayload } from "../../lib/api";
import { compactDate, formatMoney } from "../../lib/formatters";

export default function Loans() {
  const [workspace, setWorkspace] = useState(null);
  const [form, setForm] = useState({ amount: "3000", tenureMonths: "12", purpose: "Working capital" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLoans = async () => {
    const response = await api.get("/loans");
    setWorkspace(getPayload(response));
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/loans", {
        amount: Number(form.amount),
        tenureMonths: Number(form.tenureMonths),
        purpose: form.purpose,
      });
      setMessage("Loan request submitted for admin review.");
      loadLoans();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pre-approved funding based on your score"
        description="Higher scores unlock larger limits and better pricing. Apply directly from a recommended offer or submit a custom request."
      />

      <section className="space-y-5">
        {workspace?.offers?.map((offer) => (
          <div className="section-card" key={offer.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-ink">{offer.name}</h2>
                  <span className="pill">{offer.badge}</span>
                </div>
                <p className="mt-3 text-4xl font-extrabold text-ink">{formatMoney(offer.amount)}</p>
              </div>
              <span className="pill">Score {Math.round(offer.score || workspace?.credit?.score || 700)}</span>
            </div>
            <div className="mt-7 grid gap-4 border-t pt-5 md:grid-cols-3">
              <div><p className="text-sm font-bold text-slate-400">Interest</p><p className="mt-2 text-xl font-extrabold text-ink">{offer.interestRate}%</p></div>
              <div><p className="text-sm font-bold text-slate-400">Tenure</p><p className="mt-2 text-xl font-extrabold text-ink">{offer.tenureMonths} months</p></div>
              <div><p className="text-sm font-bold text-slate-400">EMI</p><p className="mt-2 text-xl font-extrabold text-ink">{formatMoney(offer.amount / offer.tenureMonths)}/mo</p></div>
            </div>
            <button className="primary-button mt-6 w-full" onClick={() => setForm({ amount: String(Math.round(offer.amount)), tenureMonths: String(offer.tenureMonths), purpose: offer.name })} type="button">
              Use This Offer
            </button>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <form className="section-card" onSubmit={handleSubmit}>
          <p className="text-sm font-bold text-slate-500">Custom application</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Need a different amount?</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Current eligible limit: {formatMoney(workspace?.credit?.eligibleLoanAmount || 0)}</p>
          {message ? <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p> : null}
          {error ? <p className="mt-4 text-sm font-bold text-red-600">{error}</p> : null}
          <label className="mt-6 block text-sm font-bold text-slate-700">
            Loan amount
            <input className="input-field mt-2" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Tenure in months
            <input className="input-field mt-2" value={form.tenureMonths} onChange={(event) => setForm({ ...form, tenureMonths: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Purpose
            <input className="input-field mt-2" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} />
          </label>
          <button className="primary-button mt-5 w-full" type="submit">Submit Application</button>
        </form>

        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Application history</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Approvals and decisions</h2>
          <div className="mt-6 space-y-4">
            {workspace?.applications?.map((loan) => (
              <div className="rounded-[1.35rem] border bg-white p-5" key={loan.id || loan._id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-extrabold text-ink">{formatMoney(loan.amount)}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{loan.purpose}</p>
                    <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{compactDate(loan.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-500">{loan.tenureMonths} months</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">{loan.interestRate}% APR</p>
                    <span className="table-chip mt-4 bg-emerald-50 text-emerald-700">{loan.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
