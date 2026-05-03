import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { compactDate, formatMoney, humanizeTransferType } from "../../lib/formatters";

export default function Transactions() {
  const { transactions, fetchTransactions } = useAdmin();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ query: "", status: "", type: "", risk: "" });

  useEffect(() => {
    const load = async () => {
      const data = await fetchTransactions();
      setStats(data?.stats || null);
    };

    load();
  }, []);

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const haystack = `${transaction.reference} ${transaction.userName} ${transaction.beneficiaryName}`.toLowerCase();
        return (
          haystack.includes(filters.query.toLowerCase()) &&
          (!filters.status || transaction.status === filters.status) &&
          (!filters.type || transaction.transferType === filters.type) &&
          (!filters.risk || transaction.riskFlag === filters.risk)
        );
      }),
    [transactions, filters]
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Transactions"
        title="Monitor platform financial flows"
        description="Track all transactions, spot suspicious activity, and review settlement performance across every transfer type."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Suspicious" value={stats?.suspicious || 0} accent="warning" icon="!" />
        <StatCard label="High Value" value={stats?.highValue || 0} icon="H" />
        <StatCard label="Pending Queue" value={stats?.pendingQueue || 0} accent="success" icon="P" />
      </section>

      <section className="section-card">
        <div className="grid gap-4 lg:grid-cols-4">
          <input className="input-field" placeholder="Search reference, user, beneficiary" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
          <select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            {["completed", "pending", "processing", "failed"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="input-field" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="">All transfer types</option>
            {["instant", "smart", "best_rate"].map((type) => <option key={type} value={type}>{humanizeTransferType(type)}</option>)}
          </select>
          <select className="input-field" value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}>
            <option value="">All risk flags</option>
            <option value="Normal">Normal</option>
            <option value="Suspicious">Suspicious</option>
          </select>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
              <tr>
                {["Reference", "User", "Beneficiary", "Sent", "Received", "Type", "Status", "Flags", "Date"].map((heading) => (
                  <th className="px-6 py-4" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((transaction) => (
                <tr key={transaction.id || transaction._id}>
                  <td className="px-6 py-5 font-extrabold text-ink">{transaction.reference}</td>
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-ink">{transaction.userName}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-slate-400">{transaction.userStatus}</p>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600">{transaction.beneficiaryName}</td>
                  <td className="px-6 py-5 font-extrabold text-ink">{formatMoney(transaction.amountSent, transaction.currencyFrom)}</td>
                  <td className="px-6 py-5 font-extrabold text-emerald-600">{formatMoney(transaction.amountReceived, transaction.currencyTo)}</td>
                  <td className="px-6 py-5"><span className="table-chip bg-slate-100 text-slate-600">{humanizeTransferType(transaction.transferType)}</span></td>
                  <td className="px-6 py-5"><span className="table-chip bg-emerald-50 text-emerald-700">{transaction.status}</span></td>
                  <td className="px-6 py-5"><span className="table-chip bg-emerald-50 text-emerald-700">{transaction.riskFlag || "Normal"}</span></td>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-500">{compactDate(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
