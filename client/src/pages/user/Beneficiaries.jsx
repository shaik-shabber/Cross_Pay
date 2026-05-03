import { useEffect, useState } from "react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import api, { getErrorMessage, getPayload } from "../../lib/api";
import { getEntityId, getInitials } from "../../lib/formatters";

const COUNTRY_OPTIONS = [
  {
    code: "IN",
    label: "India",
    currency: "INR",
    banks: [
      { name: "State Bank of India", swiftCode: "SBININBBXXX" },
      { name: "HDFC Bank", swiftCode: "HDFCINBBXXX" },
      { name: "ICICI Bank", swiftCode: "ICICINBBXXX" },
      { name: "Axis Bank", swiftCode: "AXISINBBXXX" },
      { name: "Kotak Mahindra Bank", swiftCode: "KKBKINBBXXX" },
    ],
  },
  {
    code: "US",
    label: "United States",
    currency: "USD",
    banks: [
      { name: "Bank of America", swiftCode: "BOFAUS3NXXX" },
      { name: "Chase Bank", swiftCode: "CHASUS33XXX" },
      { name: "Wells Fargo", swiftCode: "WFBIUS6SXXX" },
      { name: "Citibank", swiftCode: "CITIUS33XXX" },
    ],
  },
  {
    code: "GB",
    label: "United Kingdom",
    currency: "GBP",
    banks: [
      { name: "HSBC UK", swiftCode: "HBUKGB4BXXX" },
      { name: "Barclays", swiftCode: "BARCGB22XXX" },
      { name: "Lloyds Bank", swiftCode: "LOYDGB2LXXX" },
      { name: "NatWest", swiftCode: "NWBKGB2LXXX" },
    ],
  },
  {
    code: "AE",
    label: "United Arab Emirates",
    currency: "AED",
    banks: [
      { name: "Emirates NBD", swiftCode: "EBILAEADXXX" },
      { name: "First Abu Dhabi Bank", swiftCode: "NBADAEAAXXX" },
      { name: "Mashreq Bank", swiftCode: "BOMLAEADXXX" },
    ],
  },
  {
    code: "SG",
    label: "Singapore",
    currency: "SGD",
    banks: [
      { name: "DBS Bank", swiftCode: "DBSSSGSGXXX" },
      { name: "OCBC Bank", swiftCode: "OCBCSGSGXXX" },
      { name: "UOB", swiftCode: "UOVBSGSGXXX" },
    ],
  },
  {
    code: "AU",
    label: "Australia",
    currency: "AUD",
    banks: [
      { name: "Commonwealth Bank", swiftCode: "CTBAAU2SXXX" },
      { name: "ANZ", swiftCode: "ANZBAU3MXXX" },
      { name: "Westpac", swiftCode: "WPACAU2SXXX" },
    ],
  },
  {
    code: "CA",
    label: "Canada",
    currency: "CAD",
    banks: [
      { name: "Royal Bank of Canada", swiftCode: "ROYCCAT2XXX" },
      { name: "TD Canada Trust", swiftCode: "TDOMCATTTOR" },
      { name: "Scotiabank", swiftCode: "NOSCCATTXXX" },
    ],
  },
  {
    code: "DE",
    label: "Germany",
    currency: "EUR",
    banks: [
      { name: "Deutsche Bank", swiftCode: "DEUTDEFFXXX" },
      { name: "Commerzbank", swiftCode: "COBADEFFXXX" },
      { name: "DZ Bank", swiftCode: "GENODEFFXXX" },
    ],
  },
];

const COUNTRY_ALIASES = {
  INDIA: "IN",
  IN: "IN",
  "UNITED STATES": "US",
  USA: "US",
  US: "US",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  GB: "GB",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  AE: "AE",
  SINGAPORE: "SG",
  SG: "SG",
  AUSTRALIA: "AU",
  AU: "AU",
  CANADA: "CA",
  CA: "CA",
  GERMANY: "DE",
  DE: "DE",
};

const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

const createInitialForm = () => ({
  fullName: "",
  email: "",
  bankName: "",
  accountNumber: "",
  swiftCode: "",
  country: DEFAULT_COUNTRY.code,
  currency: DEFAULT_COUNTRY.currency,
});

const normalizeCountryCode = (value) => {
  const normalized = value?.toString().trim().toUpperCase();
  return COUNTRY_ALIASES[normalized] || normalized || DEFAULT_COUNTRY.code;
};

const getCountryConfig = (value) =>
  COUNTRY_OPTIONS.find((country) => country.code === normalizeCountryCode(value)) || null;

const getCountryLabel = (value) => getCountryConfig(value)?.label || value || "N/A";

const buildForm = (beneficiary = {}) => {
  const country = normalizeCountryCode(beneficiary.country);
  const countryConfig = getCountryConfig(country) || DEFAULT_COUNTRY;

  return {
    fullName: beneficiary.fullName || "",
    email: beneficiary.email || "",
    bankName: beneficiary.bankName || "",
    accountNumber: beneficiary.accountNumber || "",
    swiftCode: beneficiary.swiftCode?.toUpperCase() || "",
    country,
    currency: beneficiary.currency?.toUpperCase() || countryConfig.currency,
  };
};

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const selectedCountry = getCountryConfig(form.country) || DEFAULT_COUNTRY;
  const currencyOptions = Array.from(
    new Set([
      selectedCountry.currency,
      form.currency,
      "USD",
      "EUR",
      "GBP",
      "INR",
      "AED",
      "SGD",
      "AUD",
      "CAD",
    ].filter(Boolean))
  );
  const countryBanks = selectedCountry.banks || [];
  const bankOptions = form.bankName && !countryBanks.some((bank) => bank.name === form.bankName)
    ? [{ name: form.bankName, swiftCode: form.swiftCode || "" }, ...countryBanks]
    : countryBanks;

  const resetForm = () => {
    setForm(createInitialForm());
    setEditingId("");
  };

  useEffect(() => {
    const loadBeneficiaries = async () => {
      setIsLoading(true);

      try {
        const response = await api.get("/beneficiaries");
        setBeneficiaries(getPayload(response) || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadBeneficiaries();
  }, []);

  const startEditing = (beneficiary) => {
    setEditingId(getEntityId(beneficiary));
    setForm(buildForm(beneficiary));
    setMessage("");
    setError("");
  };

  const handleCountryChange = (value) => {
    const nextCountry = normalizeCountryCode(value);
    const countryConfig = getCountryConfig(nextCountry) || DEFAULT_COUNTRY;

    setForm((current) => {
      const bankMatch = countryConfig.banks.find(
        (bank) => bank.name === current.bankName
      );

      return {
        ...current,
        country: nextCountry,
        currency: countryConfig.currency,
        bankName: bankMatch ? current.bankName : "",
        swiftCode: bankMatch ? current.swiftCode : "",
      };
    });
  };

  const handleBankChange = (value) => {
    const bankMatch = selectedCountry.banks.find((bank) => bank.name === value);

    setForm((current) => ({
      ...current,
      bankName: value,
      swiftCode: bankMatch?.swiftCode || current.swiftCode,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    const beneficiaryId = editingId;

    try {
      const response = beneficiaryId
        ? await api.patch(`/beneficiaries/${beneficiaryId}`, form)
        : await api.post("/beneficiaries", form);
      const savedBeneficiary = getPayload(response);

      setBeneficiaries((current) =>
        beneficiaryId
          ? current.map((item) =>
              getEntityId(item) === beneficiaryId ? savedBeneficiary : item
            )
          : [savedBeneficiary, ...current]
      );

      resetForm();
      setMessage(
        beneficiaryId
          ? "Beneficiary updated successfully."
          : "Beneficiary saved successfully."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (beneficiary) => {
    const beneficiaryId = getEntityId(beneficiary);

    if (!beneficiaryId) {
      return;
    }

    setError("");
    setMessage("");
    setRemovingId(beneficiaryId);

    try {
      await api.delete(`/beneficiaries/${beneficiaryId}`);
      setBeneficiaries((current) =>
        current.filter((item) => getEntityId(item) !== beneficiaryId)
      );

      if (editingId === beneficiaryId) {
        resetForm();
      }

      setMessage("Beneficiary removed successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your recipient book"
        description="Store bank details once, reuse them across transfers, and update saved payout destinations whenever recipient details change."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Recipients" value={beneficiaries.length} icon="R" />
        <StatCard
          label="Active Corridors"
          value={new Set(beneficiaries.map((item) => item.currency)).size}
          accent="success"
          icon="C"
        />
        <StatCard
          label="Saved Profiles"
          value={beneficiaries.length}
          accent="violet"
          icon="S"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="section-card">
          <p className="text-sm font-bold text-slate-500">Saved recipients</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">
            Reusable payout destinations
          </h2>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Select any saved recipient to edit the bank details on the right.
          </p>

          {isLoading ? (
            <div className="soft-card mt-6 text-sm font-semibold text-slate-500">
              Loading saved beneficiaries...
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="soft-card mt-6 text-sm font-semibold text-slate-500">
              No beneficiaries saved yet. Add one from the form to start building
              your payout destination list.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {beneficiaries.map((beneficiary) => {
                const beneficiaryId = getEntityId(beneficiary);
                const isEditing = beneficiaryId === editingId;
                const accountDisplay =
                  beneficiary.maskedAccountNumber ||
                  beneficiary.accountNumber ||
                  "N/A";

                return (
                  <div
                    className={`rounded-[1.35rem] border p-5 transition ${
                      isEditing
                        ? "border-brand bg-blue-50/60"
                        : "bg-white hover:border-brand/30"
                    }`}
                    key={beneficiaryId}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-extrabold text-brand">
                        {getInitials(beneficiary.fullName)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-extrabold text-ink">
                            {beneficiary.fullName}
                          </h3>
                          <span className="pill">{beneficiary.currency}</span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-600">
                          {beneficiary.bankName}
                        </p>

                        <p className="mt-4 text-sm font-semibold text-slate-500">
                          Email: {beneficiary.email || "N/A"}
                        </p>

                        <p className="mt-2 break-words text-sm font-semibold text-slate-500">
                          Account: {accountDisplay}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          SWIFT: {beneficiary.swiftCode || "N/A"}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Country: {getCountryLabel(beneficiary.country)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        className="secondary-button"
                        onClick={() => startEditing(beneficiary)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        disabled={removingId === beneficiaryId}
                        onClick={() => handleDelete(beneficiary)}
                        type="button"
                      >
                        {removingId === beneficiaryId ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form className="section-card" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">
                {editingId ? "Update beneficiary" : "Add beneficiary"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                {editingId ? "Update a payout profile" : "Create a payout profile"}
              </h2>
            </div>

            {editingId ? <span className="pill">Editing saved recipient</span> : null}
          </div>

          {message ? (
            <p className="mt-4 text-sm font-bold text-emerald-600">{message}</p>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm font-bold text-red-600">{error}</p>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-slate-700">
              Full name
              <input
                className="input-field mt-2"
                placeholder="Enter full name as per bank account"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Email address
              <input
                className="input-field mt-2"
                placeholder="Enter recipient email (optional)"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Bank name
              <select
                className="input-field mt-2"
                value={form.bankName}
                onChange={(event) => handleBankChange(event.target.value)}
              >
                <option value="">
                  Select a bank in {selectedCountry.label}
                </option>
                {bankOptions.map((bank) => (
                  <option key={`${selectedCountry.code}-${bank.name}`} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Account number
              <input
                className="input-field mt-2"
                inputMode="numeric"
                placeholder="Enter 9-18 digit account number"
                value={form.accountNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    accountNumber: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              SWIFT code
              <input
                className="input-field mt-2"
                placeholder="e.g. SBININBBXXX"
                value={form.swiftCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    swiftCode: event.target.value.toUpperCase(),
                  }))
                }
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Country
              <select
                className="input-field mt-2"
                value={form.country}
                onChange={(event) => handleCountryChange(event.target.value)}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Destination currency
              <select
                className="input-field mt-2"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.target.value,
                  }))
                }
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button className="primary-button w-full" disabled={isSaving} type="submit">
              {isSaving
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Beneficiary"
                  : "Save Beneficiary"}
            </button>

            {editingId ? (
              <button
                className="secondary-button w-full"
                onClick={() => {
                  resetForm();
                  setMessage("");
                  setError("");
                }}
                type="button"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
