import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useWallet } from "../../context/WalletContext";
import { formatMoney, sumBalances } from "../../lib/formatters";

export default function Wallet() {
  const { wallet, fetchWallet, topUpWallet } = useWallet();
  const [form, setForm] = useState({ currency: "USD", amount: "1000" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchWallet();
  }, []);

  const balances = useMemo(() => Object.entries(wallet?.balances || {}), [wallet]);
  const total = sumBalances(wallet);
  const maxBalance = Math.max(...balances.map(([, value]) => Number(value || 0)), 1);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    await topUpWallet({ currency: form.currency, amount: Number(form.amount) });
    setMessage("Wallet topped up successfully.");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your global money hub"
        description="Manage balances, add funds, and keep enough liquidity across corridors before you create outbound transfers."
      />

      <section className="wallet-hero flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-white/80">Total Balance</p>
          <p className="mt-4 text-5xl font-extrabold">{formatMoney(total)}</p>
          <p className="mt-2 text-sm font-semibold text-white/80">Your global treasury</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-white/50">Default</p>
            <p className="mt-3 text-lg font-extrabold">{wallet?.defaultCurrency || "USD"}</p>
          </div>
          <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-white/50">Pockets</p>
            <p className="mt-3 text-lg font-extrabold">{balances.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total Footprint" value={formatMoney(total)} icon="T" />
        <StatCard label="Default Currency" value={wallet?.defaultCurrency || "USD"} accent="success" icon="D" />
        <StatCard label="Supported Pockets" value={balances.length || 0} accent="violet" icon="P" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="section-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Available balances</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">Live multi-currency positions</h2>
            </div>
            <span className="pill">Live demo balances</span>
          </div>
          <div className="mt-6 space-y-4">
            {balances.map(([currency, value]) => (
              <div className="rounded-[1.35rem] border bg-white p-5" key={currency}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">{currency}</p>
                    <p className="mt-3 text-2xl font-extrabold text-ink">{formatMoney(value, currency)}</p>
                  </div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-slate-400">
                    Share {Math.round((Number(value || 0) / Math.max(total, 1)) * 100)}%
                  </p>
                </div>
                <div className="mt-5 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-brand to-violet-500" style={{ width: `${(Number(value || 0) / maxBalance) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <form className="section-card" onSubmit={handleSubmit}>
            <p className="text-sm font-bold text-slate-500">Add funds</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Top up wallet</h2>
            <label className="mt-6 block text-sm font-bold text-slate-700">
              Currency
              <select className="input-field mt-2" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                {["USD", "EUR", "INR", "GBP"].map((currency) => <option key={currency}>{currency}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Amount
              <input className="input-field mt-2" min="1" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            </label>
            {message ? <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p> : null}
            <button className="primary-button mt-5 w-full" type="submit">Add Funds</button>
          </form>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Corridor readiness</p>
            <div className="mt-5 space-y-4">
              {balances.map(([currency, value]) => (
                <div key={currency}>
                  <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                    <span>{currency}</span>
                    <span>{formatMoney(value, currency)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(Number(value || 0) / maxBalance) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
