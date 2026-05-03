import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import api, { getPayload } from "../../lib/api";
import { compactDate, formatMoney, humanizeTransferType, sumBalances } from "../../lib/formatters";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/users/dashboard");
        setDashboard(getPayload(response));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const walletTotal = sumBalances(dashboard?.wallet);
  const stats = dashboard?.stats || {};
  const credit = dashboard?.credit || {};
  const transferMix = dashboard?.transferMix || {};
  const maxMix = Math.max(...Object.values(transferMix), 1);
  const quickStats = useMemo(
    () => [
      { label: "Total Sent", value: formatMoney(stats.totalVolume), icon: "Q" },
      { label: "Total Savings", value: formatMoney(stats.totalFeesSaved), accent: "success", icon: "S" },
      { label: "Transactions", value: stats.totalTransactions || 0, accent: "warning", icon: "T" },
      { label: "Unread Alerts", value: stats.unreadNotifications || 0, accent: "violet", icon: "A" },
    ],
    [stats]
  );

  if (loading) {
    return <div className="section-card p-8 text-sm font-bold text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Good to see you, ${dashboard?.user?.fullName?.split(" ")[0] || "there"}.`}
        description="Track wallet balances, compare transfer performance, and stay on top of savings and alerts from one clean workspace."
      />

      <section className="grid gap-5 lg:grid-cols-[1.05fr_1fr_0.9fr]">
        <div className="wallet-hero">
          <p className="text-sm font-bold text-white/80">Wallet Balance</p>
          <p className="mt-4 text-3xl md:text-4xl font-extrabold break-words">{formatMoney(walletTotal)}</p>
          <p className="mt-2 text-sm font-semibold text-white/80">Available balance</p>
          <div className="mt-7 flex gap-3">
            <Link className="secondary-button min-w-36 border-0" to="/send">Send</Link>
            <Link className="primary-button bg-white/15 shadow-none hover:bg-white/20" to="/wallet">Add</Link>
          </div>
        </div>

        <div className="section-card">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-slate-500">Credit Score</p>
            <span className="pill">{credit.riskLevel || "MEDIUM"} risk</span>
          </div>
          <p className="mt-4 text-5xl font-extrabold text-brand">{Math.round(credit.score || 700)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">out of 1000</p>
          <div className="mt-7 h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.min(100, Number(credit.score || 700) / 10)}%` }} />
          </div>
          <Link className="secondary-button mt-6 w-full" to="/credit">View Details</Link>
        </div>

        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Quick Stats</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">Operational pulse</h2>
          <div className="mt-6 space-y-4">
            {quickStats.map((item) => (
              <div className="flex items-center justify-between gap-4" key={item.label}>
                <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                <span className={item.accent === "success" ? "font-extrabold text-emerald-600" : "font-extrabold text-ink"}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["Send Money", "Create a new cross-border transfer", "/send", "S"],
          ["Beneficiaries", "Manage recipient bank details", "/beneficiaries", "B"],
          ["History", "Review completed and pending transfers", "/transactions", "H"],
        ].map(([title, text, to, icon]) => (
          <Link className="metric-card flex items-center gap-4" key={title} to={to}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-extrabold text-brand">{icon}</span>
            <span>
              <span className="block text-xl font-extrabold text-ink">{title}</span>
              <span className="mt-1 block text-sm font-semibold text-slate-500">{text}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="section-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Recent Transactions</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">Activity timeline</h2>
            </div>
            <Link className="font-bold text-brand" to="/transactions">View All</Link>
          </div>
          <div className="mt-6 space-y-3">
            {dashboard?.recentTransactions?.length ? (
              dashboard.recentTransactions.map((transaction) => (
                <div className="rounded-[1.35rem] border bg-white p-4" key={transaction.id || transaction._id}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-ink">{transaction.beneficiaryName || "Unknown recipient"}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{humanizeTransferType(transaction.transferType)} - {transaction.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-red-500">-{formatMoney(transaction.amountSent, transaction.currencyFrom)}</p>
                      <p className="mt-1 font-extrabold text-emerald-600">+{formatMoney(transaction.amountReceived, transaction.currencyTo)}</p>
                    </div>
                    <span className="table-chip bg-emerald-50 text-emerald-700">{transaction.status}</span>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{compactDate(transaction.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No transfers yet" description="Your transfer activity will appear here." />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Transfer Modes</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Distribution</h2>
            <div className="mt-6 space-y-4">
              {Object.entries(transferMix).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                    <span>{humanizeTransferType(key)}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-brand" style={{ width: `${(value / maxMix) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Notifications</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Operational alerts</h2>
            <div className="mt-5 space-y-3">
              {dashboard?.recentNotifications?.map((notification) => (
                <div className="rounded-[1.35rem] border bg-slate-50 p-4" key={notification.id || notification._id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-extrabold text-ink">{notification.title}</p>
                    <span className="pill">{notification.type}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{notification.message}</p>
                  <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{compactDate(notification.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
