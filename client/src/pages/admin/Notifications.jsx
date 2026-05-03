import { useEffect, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { getEntityId } from "../../lib/formatters";

export default function Notifications() {
  const {
    notificationsWorkspace,
    fetchNotificationsWorkspace,
    sendNotification,
  } = useAdmin();
  const [form, setForm] = useState({
    title: "Platform advisory",
    message: "Smart transfer demand is elevated today. Review the best-rate queue for potential savings.",
    userId: "all",
    type: "system",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchNotificationsWorkspace();
  }, []);

  const stats = notificationsWorkspace?.stats || {};
  const users = notificationsWorkspace?.users || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await sendNotification(form);
    setMessage(`Notification sent to ${result.sent} account${result.sent === 1 ? "" : "s"}.`);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Notifications"
        title="Targeted messages and alerts"
        description="Send updates, risk notices, and promotional alerts to all users, filtered segments, or one specific account."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Users" value={stats.users || 0} icon="U" />
        <StatCard label="Active Users" value={stats.activeUsers || 0} accent="success" icon="A" />
        <StatCard label="Review Status" value={stats.reviewStatus || 0} accent="warning" icon="R" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <form className="section-card" onSubmit={handleSubmit}>
          <p className="text-sm font-bold text-slate-500">Broadcast builder</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Compose a notification</h2>
          {message ? <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p> : null}
          <label className="mt-6 block text-sm font-bold text-slate-700">
            Title
            <input className="input-field mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Message
            <textarea className="input-field mt-2 min-h-32 resize-none" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Specific user
            <select className="input-field mt-2" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>
              <option value="all">All matching users</option>
              {users.map((user) => <option key={getEntityId(user)} value={getEntityId(user)}>{user.fullName} - {user.email}</option>)}
            </select>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Target role
              <select className="input-field mt-2"><option>Users</option></select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Target status
              <select className="input-field mt-2"><option>Any status</option></select>
            </label>
          </div>
          <button className="primary-button mt-5 w-full" type="submit">Send Notification</button>
        </form>

        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Audience preview</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Who will receive this</h2>
          <div className="mt-6 space-y-3">
            {users.map((user) => (
              <div className="rounded-[1.35rem] border p-4" key={getEntityId(user)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-ink">{user.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{user.email}</p>
                  </div>
                  <span className="pill">{user.accountStatus || "ACTIVE"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
