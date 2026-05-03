import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useTransaction } from "../../context/TransactionContext";
import { compactDate, formatMoney, humanizeTransferType } from "../../lib/formatters";

export default function Transactions() {
  const { transactions, fetchTransactions } = useTransaction();
  const [filters, setFilters] = useState({ query: "", status: "", transferType: "" });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const haystack = `${transaction.reference} ${transaction.beneficiaryName}`.toLowerCase();
        return (
          haystack.includes(filters.query.toLowerCase()) &&
          (!filters.status || transaction.status === filters.status) &&
          (!filters.transferType || transaction.transferType === filters.transferType)
        );
      }),
    [transactions, filters]
  );

  const completed = transactions.filter((transaction) => transaction.status === "completed").length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Transfer history"
        description="View all past and ongoing transfers, then filter by status, type, or beneficiary when you need a tighter view."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total Transfers" value={transactions.length} icon="T" />
        <StatCard label="Completed" value={completed} accent="success" icon="C" />
        <StatCard label="Active" value={transactions.length - completed} accent="warning" icon="A" />
      </section>

      <section className="section-card">
        <div className="grid gap-4 md:grid-cols-3">
          <input className="input-field" placeholder="Search by reference or beneficiary" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
          <select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            {["completed", "pending", "processing", "failed"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="input-field" value={filters.transferType} onChange={(event) => setFilters({ ...filters, transferType: event.target.value })}>
            <option value="">All transfer modes</option>
            {["instant", "smart", "best_rate"].map((type) => <option key={type} value={type}>{humanizeTransferType(type)}</option>)}
          </select>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
              <tr>
                {["ID", "Beneficiary", "Sent", "Received", "Type", "Fee", "Status", "Date"].map((heading) => (
                  <th className="px-6 py-4" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((transaction) => (
                <tr key={transaction.id || transaction._id}>
                  <td className="px-6 py-5 font-extrabold text-slate-500">{transaction.reference}</td>
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-ink">{transaction.beneficiaryName || "Unknown recipient"}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{transaction.currencyFrom} to {transaction.currencyTo}</p>
                  </td>
                  <td className="px-6 py-5 font-extrabold text-ink">{formatMoney(transaction.amountSent, transaction.currencyFrom)}</td>
                  <td className="px-6 py-5 font-extrabold text-emerald-600">{formatMoney(transaction.amountReceived, transaction.currencyTo)}</td>
                  <td className="px-6 py-5"><span className="table-chip bg-slate-100 text-slate-600">{humanizeTransferType(transaction.transferType)}</span></td>
                  <td className="px-6 py-5 font-bold text-slate-600">{formatMoney(transaction.feeAmount, transaction.currencyFrom)}</td>
                  <td className="px-6 py-5"><span className="table-chip bg-emerald-50 text-emerald-700">{transaction.status}</span></td>
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
