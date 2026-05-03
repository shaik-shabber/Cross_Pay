import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { compactDate, formatMoney, getEntityId } from "../../lib/formatters";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const statusClassName = {
  pending: "table-chip bg-amber-50 text-amber-700",
  approved: "table-chip bg-emerald-50 text-emerald-700",
  rejected: "table-chip bg-red-50 text-red-600",
};

export default function Loans() {
  const { loans, fetchLoans } = useAdmin();
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    const load = async () => {
      const data = await fetchLoans();
      setStats(data?.stats || null);
    };

    load();
  }, []);

  const filteredLoans = useMemo(
    () => loans.filter((loan) => loan.status === statusFilter),
    [loans, statusFilter]
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Loans"
        title="Approve and monitor lending activity"
        description="Review loan applications, control approvals, and oversee funding exposure across the credit product."
      />

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Pending Loans" value={stats?.pendingLoans || 0} accent="warning" icon="P" />
        <StatCard label="Approved Loans" value={stats?.approvedLoans || 0} accent="success" icon="A" />
        <StatCard label="Rejected Loans" value={stats?.rejectedLoans || 0} accent="violet" icon="R" />
        <StatCard label="Pending Amount" value={formatMoney(stats?.pendingAmount || 0)} icon="$" />
      </section>

      <section className="section-card">
        <p className="text-sm font-bold text-slate-500">Loan status filter</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">Pending, accepted, or rejected</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              className={statusFilter === option.value ? "primary-button w-full" : "secondary-button w-full"}
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">Current queue</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              {STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label} loans
            </h2>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              The loan workspace now opens each application in a dedicated detail page with user profile, transactions, credit score, and related records.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {filteredLoans.length ? (
            filteredLoans.map((loan) => (
              <Link
                className="block rounded-[1.35rem] border bg-white p-6 transition hover:border-brand hover:bg-blue-50/40"
                key={getEntityId(loan)}
                to={`/admin/loans/${getEntityId(loan)}`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-extrabold text-ink">{loan.userName}</h2>
                      <span className={statusClassName[loan.status] || "table-chip bg-slate-100 text-slate-700"}>
                        {STATUS_OPTIONS.find((option) => option.value === loan.status)?.label || loan.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{loan.purpose}</p>
                    <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      Applied on {compactDate(loan.createdAt)}
                    </p>
                    <p className="mt-4 text-sm font-bold text-brand">Open full details</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-4xl font-extrabold text-ink">{formatMoney(loan.amount)}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {loan.tenureMonths} months at {loan.interestRate}% APR
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="No loans in this queue"
              description="Switch the toggle above to review another loan status bucket."
            />
          )}
        </div>
      </section>
    </div>
  );
}
