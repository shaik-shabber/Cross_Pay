import { useEffect, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import api, { getPayload } from "../../lib/api";
import { formatMoney } from "../../lib/formatters";

export default function Credit() {
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    const loadCredit = async () => {
      const response = await api.get("/credit");
      setCredit(getPayload(response));
    };

    loadCredit();
  }, []);

  const score = Math.round(credit?.score || 700);
  const scorePercent = Math.min(100, score / 10);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your CrossPay financial identity"
        description="Transfer behavior, repayment posture, and transaction volume combine into a transparent score that powers offers and approvals."
      />

      <section className="section-card text-center">
        <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full" style={{ background: `conic-gradient(#10b981 ${scorePercent}%, #e8eef5 0)` }}>
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white shadow-bloom">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Credit Score</p>
            <p className="mt-2 text-5xl font-extrabold text-ink">{score}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">out of 1000</p>
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-emerald-600">
          {credit?.riskLevel === "LOW" ? "Excellent standing" : credit?.riskLevel === "HIGH" ? "Needs attention" : "Good standing"}
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          You are eligible for loan offers up to {formatMoney(credit?.eligibleLoanAmount || 0)}.
        </p>
      </section>

      <section className="section-card">
        <p className="text-sm font-bold text-slate-500">Score Factors</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">What is driving your profile</h2>
        <div className="mt-6 space-y-4">
          {[
            ["Transaction Consistency", "growing"],
            ["Transfer Volume", formatMoney(credit?.monthlyVolume || 0)],
            ["Risk Level", credit?.riskLevel || "MEDIUM"],
            ["Eligible Limit", formatMoney(credit?.eligibleLoanAmount || 0)],
          ].map(([label, value], index) => (
            <div className="flex items-center justify-between rounded-[1.35rem] border p-5" key={label}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">{index + 1}</span>
                <span className="font-extrabold text-ink">{label}</span>
              </div>
              <span className="font-extrabold text-emerald-600">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Eligible Loan Limit" value={formatMoney(credit?.eligibleLoanAmount || 0)} icon="L" />
        <StatCard label="Monthly Volume" value={formatMoney(credit?.monthlyVolume || 0)} accent="success" icon="V" />
        <StatCard label="Completed Transfers" value={credit?.transactionCount || 0} accent="violet" icon="T" />
      </section>
    </div>
  );
}
