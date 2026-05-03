import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useAdmin } from "../../context/AdminContext";
import { formatMoney, getEntityId, getVolumeProfile } from "../../lib/formatters";

const buildDraft = (credit = {}) => ({
  score: Math.round(credit.score || 700),
  riskLevel: credit.riskLevel || "MEDIUM",
  eligibleLoanAmount: credit.eligibleLoanAmount || 0,
  adminNote: credit.adminNote || "",
});

export default function Credit() {
  const { creditProfiles, fetchCreditProfiles, updateCreditProfile } = useAdmin();
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(buildDraft());
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      const data = await fetchCreditProfiles();
      setStats(data?.stats || null);
      setSelectedId(getEntityId(data?.profiles?.[0]?.user) || "");
    };

    load();
  }, []);

  const filteredProfiles = useMemo(
    () =>
      creditProfiles.filter((profile) => {
        const text = `${profile.user.fullName} ${profile.user.email}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesRisk =
          riskFilter === "ALL" || profile.credit.riskLevel === riskFilter;
        const matchesTier =
          tierFilter === "ALL" ||
          (profile.user.totalSent >= 10000 ? "PRIORITY" : "STANDARD") === tierFilter;

        return matchesQuery && matchesRisk && matchesTier;
      }),
    [creditProfiles, query, riskFilter, tierFilter]
  );

  const selectedProfile = useMemo(
    () =>
      filteredProfiles.find((profile) => getEntityId(profile.user) === selectedId) ||
      filteredProfiles[0] ||
      creditProfiles.find((profile) => getEntityId(profile.user) === selectedId) ||
      creditProfiles[0],
    [creditProfiles, filteredProfiles, selectedId]
  );

  useEffect(() => {
    if (filteredProfiles.length && !filteredProfiles.some((profile) => getEntityId(profile.user) === selectedId)) {
      setSelectedId(getEntityId(filteredProfiles[0].user));
      return;
    }

    setDraft(buildDraft(selectedProfile?.credit));
  }, [filteredProfiles, selectedId, selectedProfile?.credit?.updatedAt]);

  const save = async () => {
    if (!selectedProfile?.user) return;
    await updateCreditProfile(getEntityId(selectedProfile.user), draft);
    await fetchCreditProfiles();
    setMessage("Credit profile updated.");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Admin Credit"
        title="Manage the credit scoring system"
        description="Review user credit posture, adjust scores when needed, and control loan eligibility across the platform."
      />

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Average Score" value={stats?.averageScore || 0} icon="S" />
        <StatCard label="Low Risk" value={stats?.lowRisk || 0} accent="success" icon="L" />
        <StatCard label="Priority Profiles" value={stats?.priorityProfiles || 0} accent="violet" icon="P" />
        <StatCard label="High Risk" value={stats?.highRisk || 0} accent="warning" icon="H" />
      </section>

      <section className="section-card">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Search user name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="input-field"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="ALL">All risk levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select
            className="input-field"
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
          >
            <option value="ALL">All sending tiers</option>
            <option value="STANDARD">Standard</option>
            <option value="PRIORITY">Priority</option>
          </select>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.15fr]">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Credit profiles</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Ranked profiles</h2>
          <div className="mt-6 max-h-[42rem] space-y-3 overflow-y-auto pr-2">
            {filteredProfiles.map((profile) => (
              <button
                className={`w-full rounded-[1.35rem] border p-4 text-left ${getEntityId(profile.user) === getEntityId(selectedProfile?.user) ? "border-brand bg-blue-50/60" : "bg-white"}`}
                key={getEntityId(profile.user)}
                onClick={() => setSelectedId(getEntityId(profile.user))}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-ink">{profile.user.fullName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{profile.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="pill">{profile.credit.riskLevel}</span>
                    <span className="pill">{getVolumeProfile(profile.user.totalSent || 0).priority}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-extrabold text-ink">{Math.round(profile.credit.score || 700)}</p>
                  <p className="font-bold text-slate-500">{formatMoney(profile.credit.eligibleLoanAmount || 0)}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Sending tier: {getVolumeProfile(profile.user.totalSent || 0).label}
                </p>
              </button>
            ))}
            {!filteredProfiles.length ? (
              <EmptyState
                title="No profiles match these filters"
                description="Try broadening the search, risk level, or tier filter."
              />
            ) : null}
          </div>
        </div>

        <div className="section-card">
          {selectedProfile ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">Selected profile</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-ink">{selectedProfile.user.fullName}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{selectedProfile.user.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className="pill">{selectedProfile.user.accountStatus || "ACTIVE"}</span>
                  <span className="pill">{selectedProfile.credit.riskLevel}</span>
                  <span className="pill">{getVolumeProfile(selectedProfile.user.totalSent || 0).priority}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatCard label="Current Score" value={Math.round(selectedProfile.credit.score || 700)} icon="C" />
                <StatCard label="Eligible Limit" value={formatMoney(selectedProfile.credit.eligibleLoanAmount || 0)} accent="success" icon="L" />
                <StatCard
                  label="Transfer Volume"
                  value={formatMoney(selectedProfile.credit.monthlyVolume || 0)}
                  accent="violet"
                  icon="V"
                  hint={getVolumeProfile(selectedProfile.user.totalSent || 0).label}
                />
              </div>

              {message ? <p className="mt-5 text-sm font-bold text-emerald-600">{message}</p> : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Score
                  <input className="input-field mt-2" value={draft.score} onChange={(event) => setDraft({ ...draft, score: event.target.value })} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Risk level
                  <select className="input-field mt-2" value={draft.riskLevel} onChange={(event) => setDraft({ ...draft, riskLevel: event.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Eligible loan amount
                  <input className="input-field mt-2" value={draft.eligibleLoanAmount} onChange={(event) => setDraft({ ...draft, eligibleLoanAmount: event.target.value })} />
                </label>
                <label className="block text-sm font-bold text-slate-700 md:col-span-2">
                  Admin note
                  <input className="input-field mt-2" value={draft.adminNote} onChange={(event) => setDraft({ ...draft, adminNote: event.target.value })} />
                </label>
              </div>

              <button className="primary-button mt-5 w-full" onClick={save} type="button">Update Credit Profile</button>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
