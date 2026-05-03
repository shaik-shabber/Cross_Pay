import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import {
  compactDate,
  formatDate,
  formatMoney,
  humanizeTransferType,
} from "../../lib/formatters";

const editableFields = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["country", "Country"],
  ["phone", "Phone"],
  ["occupation", "Occupation"],
  ["address", "Address"],
  ["adminNote", "Admin note"],
];

const buildDraft = (user = {}) => ({
  fullName: user.fullName || "",
  email: user.email || "",
  country: user.country || "",
  phone: user.phone || "",
  occupation: user.occupation || "",
  address: user.address || "",
  adminNote: user.adminNote || "",
  accountStatus: user.accountStatus || "ACTIVE",
  kycStatus: user.kycStatus || "VERIFIED",
  preferredTransferType: user.preferredTransferType || "smart",
  fraudFlag: Boolean(user.fraudFlag),
});

export default function UserDetails() {
  const { userId } = useParams();
  const { fetchUserDetails, updateUser } = useAdmin();
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState(buildDraft());
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchUserDetails(userId);
      setDetail(data);
      setDraft(buildDraft(data?.user));
    } catch (requestError) {
      setError(requestError.message || "Failed to load user details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [userId]);

  const user = detail?.user;
  const transactions = detail?.transactions || [];
  const beneficiaries = detail?.beneficiaries || [];
  const notifications = detail?.notifications || [];
  const loans = detail?.loans || [];

  const stats = useMemo(
    () => [
      {
        label: "Wallet Balance",
        value: formatMoney(user?.totalBalance || 0),
        icon: "W",
      },
      {
        label: "Credit Score",
        value: Math.round(user?.credit?.score || 700),
        accent: "success",
        icon: "C",
        hint: user?.credit?.riskLevel || "MEDIUM",
      },
      {
        label: "Transactions",
        value: transactions.length,
        accent: "warning",
        icon: "T",
        hint: `${transactions.filter((item) => item.status === "completed").length} completed`,
      },
      {
        label: "Loan Applications",
        value: loans.length,
        accent: "violet",
        icon: "L",
        hint: `${notifications.filter((item) => !item.read).length} unread alerts`,
      },
    ],
    [loans.length, notifications, transactions, user]
  );

  const saveChanges = async () => {
    if (!userId) {
      return;
    }

    await updateUser(userId, draft);
    setEditing(false);
    setMessage("User changes saved.");
    await loadDetails();
  };

  if (loading) {
    return (
      <div className="section-card p-8 text-sm font-bold text-slate-500">
        Loading user details...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="section-card p-8">
        <p className="text-sm font-bold text-red-600">
          {error || "User details could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="User Details"
        title={user.fullName}
        description="Review the full customer record, inspect transaction activity, and update profile controls when needed."
        action={
          <Link className="secondary-button" to="/admin/users">
            Back to Users
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Profile record</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                Account controls
              </h2>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Full profile data stays here. The ranked users page now only shows a compact summary.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="pill">{user.accountStatus || "ACTIVE"}</span>
              <span className="pill">{user.kycStatus || "VERIFIED"}</span>
              <span className="pill">{user.credit?.riskLevel || "MEDIUM"}</span>
            </div>
          </div>

          {message ? (
            <p className="mt-5 text-sm font-bold text-emerald-600">{message}</p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {editableFields.map(([key, label]) => (
              <label
                className={
                  key === "address" || key === "adminNote"
                    ? "block text-sm font-bold text-slate-700 md:col-span-2"
                    : "block text-sm font-bold text-slate-700"
                }
                key={key}
              >
                {label}
                <input
                  className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!editing}
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}

            <label className="block text-sm font-bold text-slate-700">
              Account status
              <select
                className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editing}
                value={draft.accountStatus}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    accountStatus: event.target.value,
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              KYC status
              <select
                className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editing}
                value={draft.kycStatus}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kycStatus: event.target.value,
                  }))
                }
              >
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Preferred transfer
              <select
                className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editing}
                value={draft.preferredTransferType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    preferredTransferType: event.target.value,
                  }))
                }
              >
                <option value="smart">Smart</option>
                <option value="instant">Instant</option>
                <option value="best_rate">Best Rate</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[1.35rem] border bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input
                checked={draft.fraudFlag}
                disabled={!editing}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fraudFlag: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Mark fraud flag
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {!editing ? (
              <button
                className="primary-button sm:col-span-2"
                onClick={() => {
                  setMessage("");
                  setEditing(true);
                }}
                type="button"
              >
                Edit User Details
              </button>
            ) : (
              <>
                <button className="primary-button" onClick={saveChanges} type="button">
                  Save User Changes
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setDraft(buildDraft(user));
                    setEditing(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              className="secondary-button"
              disabled={!editing}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  accountStatus: "SUSPENDED",
                }))
              }
              type="button"
            >
              Archive Account
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Profile facts</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              Operational overview
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Last active", user.lastActive ? formatDate(user.lastActive) : "N/A"],
                ["Beneficiaries", beneficiaries.length],
                ["Unread alerts", notifications.filter((item) => !item.read).length],
                ["Loans", loans.length],
                ["Total sent", formatMoney(user.totalSent || 0)],
                ["Wallet default", user.wallet?.defaultCurrency || "USD"],
              ].map(([label, value]) => (
                <div className="soft-card" key={label}>
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-2 font-extrabold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Recent notifications</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Alert history</h2>
            <div className="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-2">
              {notifications.length ? (
                notifications.map((notification) => (
                  <div className="rounded-[1.35rem] border p-4" key={notification.id || notification._id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-ink">{notification.title}</p>
                      <span className="pill">{notification.read ? "Read" : "Unread"}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                      {notification.message}
                    </p>
                    <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      {compactDate(notification.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No alerts for this user"
                  description="Notifications created for this customer will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Transaction history</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Latest transfers</h2>
          <div className="mt-6 max-h-[30rem] space-y-3 overflow-y-auto pr-2">
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
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No transactions yet"
                description="This customer has not completed any transfers yet."
              />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Beneficiaries</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Saved payout profiles</h2>
            <div className="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-2">
              {beneficiaries.length ? (
                beneficiaries.map((beneficiary) => (
                  <div className="rounded-[1.35rem] border p-4" key={beneficiary.id || beneficiary._id}>
                    <p className="font-extrabold text-ink">{beneficiary.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {beneficiary.bankName} - {beneficiary.currency}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {beneficiary.country}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No beneficiaries saved"
                  description="Payout profiles for this customer will appear here."
                />
              )}
            </div>
          </div>

          <div className="section-card">
            <p className="text-sm font-bold text-slate-500">Loan applications</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Credit activity</h2>
            <div className="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-2">
              {loans.length ? (
                loans.map((loan) => (
                  <Link
                    className="block rounded-[1.35rem] border p-4 transition hover:border-brand hover:bg-blue-50/40"
                    key={loan.id || loan._id}
                    to={`/admin/loans/${loan.id || loan._id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-extrabold text-ink">{loan.purpose}</p>
                      <span className="pill">{loan.status}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      {formatMoney(loan.amount)} - {loan.tenureMonths} months at {loan.interestRate}% APR
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No loan applications"
                  description="Loan requests for this customer will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
