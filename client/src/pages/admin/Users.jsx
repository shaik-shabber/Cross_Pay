import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { formatMoney, getEntityId, getVolumeProfile } from "../../lib/formatters";

export default function Users() {
  const { users, fetchUsers } = useAdmin();
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      const data = await fetchUsers();
      setStats(data?.stats || null);
    };

    load();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const volumeProfile = getVolumeProfile(user.totalSent || 0);
        const matchesQuery = `${user.fullName} ${user.email} ${user.country} ${user.phone || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "ALL" || (user.accountStatus || "ACTIVE") === statusFilter;
        const matchesTier =
          tierFilter === "ALL" || volumeProfile.key === tierFilter;

        return matchesQuery && matchesStatus && matchesTier;
      }),
    [query, statusFilter, tierFilter, users]
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="User Management"
        title="Monitor and manage customer profiles"
        description="Review customer details, inspect account activity, and only update records after entering edit mode."
      />

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers || users.length} icon="U" />
        <StatCard label="Active" value={stats?.activeUsers || 0} accent="success" icon="A" />
        <StatCard label="Priority Senders" value={stats?.prioritySenders || 0} accent="violet" icon="P" />
        <StatCard label="Under Review" value={stats?.underReview || 0} accent="warning" icon="R" />
      </section>

      <section className="section-card">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
          <input
            className="input-field"
            placeholder="Search name, email, country, or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All account statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            className="input-field"
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
          >
            <option value="ALL">All sending tiers</option>
            <option value="UNDER_10K">Under 10K</option>
            <option value="10K_100K">10K to 100K</option>
            <option value="100K_1M">100K to 1M</option>
            <option value="1M_PLUS">Above 1M</option>
          </select>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_0.75fr]">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Customer list</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Ranked users</h2>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Only the compact summary stays here. Click any user to open full details, transactions, credit, and activity.
          </p>
          <div className="mt-6 max-h-[42rem] space-y-3 overflow-y-auto pr-2">
            {filteredUsers.length ? (
              filteredUsers.map((user) => {
                const volumeProfile = getVolumeProfile(user.totalSent || 0);

                return (
                  <Link
                    className="block rounded-[1.35rem] border bg-white p-4 text-left transition hover:border-brand hover:bg-blue-50/40"
                    key={getEntityId(user)}
                    to={`/admin/users/${getEntityId(user)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-extrabold text-ink">{user.fullName}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <span className="pill">{user.accountStatus || "ACTIVE"}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-500">
                      <span>Sent volume {volumeProfile.label}</span>
                      <span>{formatMoney(user.totalSent)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-500">
                      <span>Score {Math.round(user.credit?.score || 700)}</span>
                      <span>{formatMoney(user.totalBalance)}</span>
                    </div>
                    <p className="mt-4 text-sm font-bold text-brand">Open full profile</p>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                title="No users match these filters"
                description="Try adjusting the search or filter combination."
              />
            )}
          </div>
        </div>

        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Review flow</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Open a full customer workspace</h2>
          <div className="mt-6 space-y-4">
            {[
              "Compact cards stay on this page so the list is easier to scan.",
              "Click any customer to open their full profile, credit data, beneficiaries, notifications, and transactions.",
              "The ranked user list now scrolls inside its own container after it grows.",
            ].map((line) => (
              <div className="soft-card" key={line}>
                <p className="text-sm font-semibold leading-6 text-slate-600">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
