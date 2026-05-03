import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import api, { getErrorMessage, getPayload } from "../../lib/api";
import { compactDate, formatMoney, sumBalances } from "../../lib/formatters";

const buildForm = (user = {}) => ({
  fullName: user.fullName || "",
  country: user.country || "",
  phone: user.phone || "",
  address: user.address || "",
  occupation: user.occupation || "",
  preferredTransferType: user.preferredTransferType || "smart",
});

export default function Profile() {
  const { logout, refreshSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(buildForm());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users/profile");
      const data = getPayload(response);
      setProfile(data);
      setForm(buildForm(data?.user));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const resetEditor = () => {
    setForm(buildForm(profile?.user));
    setEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setMessage("");
    setError("");
    setSaving(true);

    try {
      await api.patch("/users/profile", form);
      await refreshSession();
      await loadProfile();
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const user = profile?.user || {};

  return (
    <div className="space-y-7">
      <PageHeader
        title="Profile and account settings"
        description="Review your personal details, update your payout preferences, and keep your account information current."
        action={<Link className="secondary-button" to="/dashboard">Back to Dashboard</Link>}
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Wallet Total" value={formatMoney(sumBalances(profile?.wallet))} icon="W" />
        <StatCard label="Credit Score" value={Math.round(profile?.credit?.score || 700)} accent="success" icon="C" hint={profile?.credit?.riskLevel || "MEDIUM"} />
        <StatCard label="Unread Alerts" value={profile?.stats?.unreadNotifications || 0} accent="violet" icon="N" hint={`${profile?.stats?.transactions || 0} transfers`} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
        <div className="section-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Account snapshot</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">{user.fullName || "Profile"}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">{user.email || "No email available"}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <span className="pill">{user.accountStatus || "ACTIVE"}</span>
              <span className="pill">{user.kycStatus || "VERIFIED"}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Country", user.country],
              ["Phone", user.phone],
              ["Occupation", user.occupation],
              ["Preferred Transfer", user.preferredTransferType],
            ].map(([label, value]) => (
              <div className="soft-card" key={label}>
                <p className="text-sm font-bold text-slate-500">{label}</p>
                <p className="mt-3 text-lg font-extrabold text-ink">{value || "N/A"}</p>
              </div>
            ))}
          </div>
          <div className="soft-card mt-4">
            <p className="text-sm font-bold text-slate-500">Address</p>
            <p className="mt-3 text-lg font-semibold text-ink">{user.address || "N/A"}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link className="secondary-button" to="/transactions">View History</Link>
            <button className="danger-button" onClick={logout} type="button">Sign Out</button>
          </div>
        </div>

        <form className="section-card" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">Update details</p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">Keep your account current</h2>
            </div>
            {editing ? <span className="pill">Edit mode enabled</span> : null}
          </div>

          {message ? <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p> : null}
          {error ? <p className="mt-4 text-sm font-bold text-red-600">{error}</p> : null}
          {!editing ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Click edit before changing your profile information.
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {[
              ["fullName", "Full name"],
              ["country", "Country"],
              ["phone", "Phone"],
              ["address", "Address"],
              ["occupation", "Occupation"],
            ].map(([key, label]) => (
              <label className="block text-sm font-bold text-slate-700" key={key}>
                {label}
                <input
                  className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!editing || loading}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
            <label className="block text-sm font-bold text-slate-700">
              Preferred transfer type
              <select
                className="input-field mt-2 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!editing || loading}
                value={form.preferredTransferType}
                onChange={(event) =>
                  setForm((current) => ({
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
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {!editing ? (
              <button
                className="primary-button w-full sm:col-span-2"
                disabled={loading || !profile}
                onClick={() => {
                  setMessage("");
                  setError("");
                  setEditing(true);
                }}
                type="button"
              >
                {loading ? "Loading..." : "Edit Profile"}
              </button>
            ) : (
              <>
                <button className="primary-button w-full" disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="secondary-button w-full"
                  onClick={() => {
                    setMessage("");
                    setError("");
                    resetEditor();
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Recent transfers</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Latest activity</h2>
          <div className="mt-6 space-y-3">
            {profile?.recentTransactions?.map((transaction) => (
              <div className="rounded-[1.35rem] border p-4" key={transaction.id || transaction._id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-ink">{transaction.reference}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{transaction.transferType} - {transaction.status}</p>
                    <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{compactDate(transaction.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-ink">{formatMoney(transaction.amountSent, transaction.currencyFrom)}</p>
                    <p className="mt-2 text-sm font-extrabold text-emerald-600">{formatMoney(transaction.amountReceived, transaction.currencyTo)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Notifications</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Recent account updates</h2>
          <div className="mt-6 space-y-3">
            {profile?.recentNotifications?.map((notification) => (
              <div className="rounded-[1.35rem] border p-4" key={notification.id || notification._id}>
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
      </section>
    </div>
  );
}
