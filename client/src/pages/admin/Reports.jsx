import { useEffect } from "react";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { formatMoney, humanizeTransferType } from "../../lib/formatters";

export default function Reports() {
  const { reports, fetchReports } = useAdmin();

  useEffect(() => {
    fetchReports();
  }, []);

  const stats = reports?.stats || {};
  const transferMix = reports?.transferMix || {};
  const maxMix = Math.max(...Object.values(transferMix), 1);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Reports"
        title="Revenue, growth, and transfer analytics"
        description="Review platform performance trends, monitor routing choices, and surface risk signals before they become operational issues."
      />

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(stats.revenue)} icon="$" />
        <StatCard label="User Growth" value={stats.totalUsers || 0} accent="success" icon="U" />
        <StatCard label="Transaction Volume" value={formatMoney(stats.completedVolume)} accent="warning" icon="V" />
        <StatCard label="Suspicious Transfers" value={stats.suspiciousTransfers || 0} accent="violet" icon="!" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {(reports?.trends || []).slice(0, 2).map((trend) => (
          <div className="section-card" key={trend.date}>
            <p className="text-sm font-bold text-slate-500">{trend.date}</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              {trend.revenue ? "Fee generation over time" : "Amounts sent over time"}
            </h2>
            <div className="mt-6 flex justify-between text-sm font-semibold text-slate-600">
              <span>{trend.date}</span>
              <span>{formatMoney(trend.revenue || trend.volume)}</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-brand" style={{ width: "100%" }} />
            </div>
          </div>
        ))}
      </section>

      <section className="section-card">
        <p className="text-sm font-bold text-slate-500">Transfer effectiveness</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">Mode performance summary</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Object.entries(transferMix).map(([key, value]) => (
            <StatCard key={key} label={`${humanizeTransferType(key)} Transfers`} value={value} icon={key[0]?.toUpperCase()} />
          ))}
          <StatCard label="Total Savings" value={formatMoney(stats.revenue)} accent="violet" icon="$" />
        </div>
        <div className="mt-6 space-y-4">
          {Object.entries(transferMix).map(([key, value]) => (
            <div key={key}>
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                <span>{humanizeTransferType(key)}</span>
                <span>{value}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${(value / maxMix) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Suspicious transfers</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Risk signals</h2>
          <div className="mt-6">
            {reports?.riskSignals?.length ? (
              reports.riskSignals.map((transaction) => (
                <div className="rounded-[1.35rem] border p-4" key={transaction.id || transaction._id}>
                  <p className="font-extrabold text-ink">{transaction.reference}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No suspicious transfers" description="Flagged transactions will appear here for analytics review." />
            )}
          </div>
        </div>
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Users under review</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Account watchlist</h2>
          <div className="mt-6">
            {reports?.watchlist?.length ? (
              reports.watchlist.map((user) => (
                <div className="rounded-[1.35rem] border p-4" key={user.id || user._id}>
                  <p className="font-extrabold text-ink">{user.fullName}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No users under review" description="Accounts placed under review will appear here." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
