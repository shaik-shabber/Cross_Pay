import { useEffect } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { formatMoney, humanizeTransferType } from "../../lib/formatters";

export default function Dashboard() {
  const { overview, fetchOverview } = useAdmin();

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = overview?.stats || {};
  const transferMix = overview?.transferMix || {};
  const maxMix = Math.max(...Object.values(transferMix), 1);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Platform control center"
        description="Monitor users, transactions, revenue, credit health, and system behavior from one central operating view."
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(stats.revenue)} icon="$" />
        <StatCard label="Total Users" value={stats.totalUsers || 0} accent="success" icon="U" hint={`${stats.activeUsers || 0} active users`} />
        <StatCard label="Completed Volume" value={formatMoney(stats.completedVolume)} accent="warning" icon="T" hint="100% success rate" />
        <StatCard label="Avg Credit Score" value={stats.avgCreditScore || 0} accent="violet" icon="R" hint={`${stats.pendingLoans || 0} pending loans`} />
        <StatCard label="Active Users" value={stats.activeUsers || 0} icon="A" hint="Accounts in good standing" />
        <StatCard label="Pending Transfers" value={stats.pendingTransfers || 0} accent="warning" icon="P" hint="Waiting for settlement" />
        <StatCard label="Pending Loans" value={stats.pendingLoans || 0} accent="success" icon="L" hint="Require admin review" />
        <StatCard label="Suspicious Transfers" value={stats.suspiciousTransfers || 0} accent="warning" icon="!" hint="Flagged for closer review" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="section-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Transfer mode distribution</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">Routing mix</h2>
            </div>
            <Link className="font-bold text-brand" to="/admin/reports">Open reports</Link>
          </div>
          <div className="mt-6 space-y-4">
            {Object.entries(transferMix).map(([key, value]) => (
              <div key={key}>
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                  <span>{humanizeTransferType(key)}</span>
                  <span>{Math.round((value / maxMix) * 33) || 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-brand" style={{ width: `${(value / maxMix) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="soft-card">
              <p className="text-sm font-bold text-slate-500">Wallet holdings</p>
              <p className="mt-3 text-2xl font-extrabold text-ink">{formatMoney(stats.walletHoldings)}</p>
            </div>
            <div className="soft-card">
              <p className="text-sm font-bold text-slate-500">Risk exposure</p>
              <p className="mt-3 text-2xl font-extrabold text-ink">{stats.highRiskAccounts || 0} high-risk accounts</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">User overview</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">Recently active customers</h2>
            </div>
            <Link className="font-bold text-brand" to="/admin/users">Manage users</Link>
          </div>
          <div className="mt-6 space-y-3">
            {overview?.recentUsers?.map((user) => (
              <div className="rounded-[1.35rem] border p-4" key={user.id || user._id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-ink">{user.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-ink">{Math.round(user.credit?.score || 700)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{formatMoney(user.totalBalance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <p className="text-sm font-bold text-slate-500">Admin workflows</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">Dedicated management pages</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["User Management", "View, update, review, and archive accounts.", "/admin/users"],
            ["Transaction Monitoring", "Track suspicious, high-value, pending, and failed transfers.", "/admin/transactions"],
            ["Credit Control", "Review scores, eligible limits, and account risk posture.", "/admin/credit"],
            ["Analytics & Reports", "Monitor revenue trends, user growth, and transfer effectiveness.", "/admin/reports"],
          ].map(([title, text, to]) => (
            <Link className="rounded-[1.35rem] border p-5 transition hover:border-brand hover:bg-blue-50/40" key={title} to={to}>
              <p className="font-extrabold text-ink">{title}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Flagged activity</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Transfers to review</h2>
          </div>
          <Link className="font-bold text-brand" to="/admin/transactions">Full monitor</Link>
        </div>
        <div className="mt-6">
          {overview?.flaggedTransactions?.length ? (
            overview.flaggedTransactions.map((transaction) => (
              <div className="rounded-[1.35rem] border p-4" key={transaction.id || transaction._id}>
                <p className="font-extrabold text-ink">{transaction.reference}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{transaction.userName} - {formatMoney(transaction.amountSent, transaction.currencyFrom)}</p>
              </div>
            ))
          ) : (
            <EmptyState title="No transfers flagged" description="Suspicious and high-value transfers will appear here for quick review." />
          )}
        </div>
      </section>
    </div>
  );
}
