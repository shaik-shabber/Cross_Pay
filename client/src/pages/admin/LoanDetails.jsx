import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import {
  compactDate,
  formatMoney,
  humanizeTransferType,
} from "../../lib/formatters";

const statusLabel = {
  pending: "Pending",
  approved: "Accepted",
  rejected: "Rejected",
};

const statusClassName = {
  pending: "table-chip bg-amber-50 text-amber-700",
  approved: "table-chip bg-emerald-50 text-emerald-700",
  rejected: "table-chip bg-red-50 text-red-600",
};

export default function LoanDetails() {
  const { loanId } = useParams();
  const { fetchLoanDetails, updateLoan } = useAdmin();
  const [detail, setDetail] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");

  const loadDetails = async () => {
    if (!loanId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchLoanDetails(loanId);
      setDetail(data);
      setAdminNote(data?.loan?.adminNote || "");
    } catch (requestError) {
      setError(requestError.message || "Failed to load loan details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [loanId]);

  const loan = detail?.loan;
  const user = detail?.user;
  const transactions = detail?.transactions || [];
  const beneficiaries = detail?.beneficiaries || [];
  const notifications = detail?.notifications || [];
  const relatedLoans = detail?.relatedLoans || [];

  const stats = useMemo(
    () => [
      {
        label: "Requested Amount",
        value: formatMoney(loan?.amount || 0),
        icon: "$",
      },
      {
        label: "Credit Score",
        value: Math.round(user?.credit?.score || 700),
        accent: "success",
        icon: "C",
        hint: user?.credit?.riskLevel || "MEDIUM",
      },
      {
        label: "Transfers",
        value: transactions.length,
        accent: "warning",
        icon: "T",
        hint: `${transactions.filter((item) => item.status === "completed").length} completed`,
      },
      {
        label: "Saved Beneficiaries",
        value: beneficiaries.length,
        accent: "violet",
        icon: "B",
        hint: `${relatedLoans.length} total loans`,
      },
    ],
    [beneficiaries.length, loan?.amount, relatedLoans.length, transactions, user]
  );

  const handleDecision = async (status) => {
    if (!loanId) {
      return;
    }

    setBusyAction(status);
    await updateLoan(loanId, {
      status,
      adminNote,
    });
    setMessage(`Loan moved to ${statusLabel[status] || status}.`);
    setBusyAction("");
    await loadDetails();
  };

  const saveNote = async () => {
    if (!loanId) {
      return;
    }

    setBusyAction("note");
    await updateLoan(loanId, { adminNote });
    setMessage("Admin note saved.");
    setBusyAction("");
    await loadDetails();
  };

  if (loading) {
    return (
      <div className="section-card p-8 text-sm font-bold text-slate-500">
        Loading loan details...
      </div>
    );
  }

  if (error || !loan || !user) {
    return (
      <div className="section-card p-8">
        <p className="text-sm font-bold text-red-600">
          {error || "Loan details could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Loan Details"
        title={`${user.fullName} - ${statusLabel[loan.status] || loan.status}`}
        description="Review the applicant, inspect supporting activity, and manage the loan decision from one dedicated page."
        action={
          <Link className="secondary-button" to="/admin/loans">
            Back to Loans
          </Link>
        }
      />

      <section className="grid gap-5 md:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="section-card">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-extrabold text-ink">{loan.purpose}</h2>
                <span className={statusClassName[loan.status] || "table-chip bg-slate-100 text-slate-700"}>
                  {statusLabel[loan.status] || loan.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Applied on {compactDate(loan.createdAt)}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-4xl font-extrabold text-ink">{formatMoney(loan.amount)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {loan.tenureMonths} months at {loan.interestRate}% APR
              </p>
            </div>
          </div>

          {message ? (
            <p className="mt-5 text-sm font-bold text-emerald-600">{message}</p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Applicant", user.fullName],
              ["Email", user.email],
              ["Country", user.country || "N/A"],
              ["Phone", user.phone || "N/A"],
              ["Occupation", user.occupation || "N/A"],
              ["Wallet Balance", formatMoney(user.totalBalance || 0)],
            ].map(([label, value]) => (
              <div className="soft-card" key={label}>
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-2 font-extrabold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <label className="mt-6 block text-sm font-bold text-slate-700">
            Admin note
            <textarea
              className="input-field mt-2 min-h-32 resize-none"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
          </label>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              className="secondary-button"
              disabled={busyAction === "note"}
              onClick={saveNote}
              type="button"
            >
              {busyAction === "note" ? "Saving..." : "Save Note"}
            </button>

            {loan.status === "pending" ? (
              <>
                <button
                  className="primary-button"
                  disabled={busyAction === "approved"}
                  onClick={() => handleDecision("approved")}
                  type="button"
                >
                  {busyAction === "approved" ? "Updating..." : "Accept Loan"}
                </button>
                <button
                  className="danger-button"
                  disabled={busyAction === "rejected"}
                  onClick={() => handleDecision("rejected")}
                  type="button"
                >
                  {busyAction === "rejected" ? "Updating..." : "Reject Loan"}
                </button>
              </>
            ) : (
              <div className="soft-card sm:col-span-2">
                <p className="text-sm font-semibold text-slate-500">
                  This loan is already in the {statusLabel[loan.status] || loan.status} queue.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Credit posture</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Applicant summary</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="soft-card">
                <p className="text-xs font-bold text-slate-500">Credit score</p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {Math.round(user.credit?.score || 700)}
                </p>
              </div>
              <div className="soft-card">
                <p className="text-xs font-bold text-slate-500">Eligible limit</p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {formatMoney(user.credit?.eligibleLoanAmount || 0)}
                </p>
              </div>
              <div className="soft-card">
                <p className="text-xs font-bold text-slate-500">Risk level</p>
                <p className="mt-2 font-extrabold text-ink">
                  {user.credit?.riskLevel || "MEDIUM"}
                </p>
              </div>
              <div className="soft-card">
                <p className="text-xs font-bold text-slate-500">Monthly volume</p>
                <p className="mt-2 font-extrabold text-ink">
                  {formatMoney(user.credit?.monthlyVolume || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Recent notifications</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">User alerts</h2>
            <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-2">
              {notifications.length ? (
                notifications.map((notification) => (
                  <div className="rounded-[1.35rem] border p-4" key={notification.id || notification._id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-ink">{notification.title}</p>
                      <span className="pill">{notification.read ? "Read" : "Unread"}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      {notification.message}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No alerts for this applicant"
                  description="Notifications for this user will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Related transfers</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Transaction history</h2>
          <div className="mt-6 max-h-[28rem] space-y-3 overflow-y-auto pr-2">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div className="rounded-[1.35rem] border p-4" key={transaction.id || transaction._id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-ink">
                        {transaction.beneficiaryName || "Unknown beneficiary"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {humanizeTransferType(transaction.transferType)} - {transaction.reference}
                      </p>
                      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                        {compactDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-red-500">
                        -{formatMoney(transaction.amountSent, transaction.currencyFrom)}
                      </p>
                      <p className="mt-1 font-extrabold text-emerald-600">
                        +{formatMoney(transaction.amountReceived, transaction.currencyTo)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No transfers found"
                description="Customer transaction history will appear here."
              />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Other loan records</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Application history</h2>
            <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-2">
              {relatedLoans.length ? (
                relatedLoans.map((item) => (
                  <Link
                    className={`block rounded-[1.35rem] border p-4 transition hover:border-brand hover:bg-blue-50/40 ${
                      (item.id || item._id) === (loan.id || loan._id)
                        ? "border-brand bg-blue-50/60"
                        : "bg-white"
                    }`}
                    key={item.id || item._id}
                    to={`/admin/loans/${item.id || item._id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-ink">{item.purpose}</p>
                      <span className="pill">{statusLabel[item.status] || item.status}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      {formatMoney(item.amount)} - {item.tenureMonths} months
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No loan history"
                  description="Other applications for this user will appear here."
                />
              )}
            </div>
          </div>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Saved beneficiaries</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Payout destinations</h2>
            <div className="mt-5 max-h-[20rem] space-y-3 overflow-y-auto pr-2">
              {beneficiaries.length ? (
                beneficiaries.map((beneficiary) => (
                  <div className="rounded-[1.35rem] border p-4" key={beneficiary.id || beneficiary._id}>
                    <p className="font-extrabold text-ink">{beneficiary.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {beneficiary.bankName} - {beneficiary.currency}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No beneficiaries saved"
                  description="Recipient profiles for this applicant will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
