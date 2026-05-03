export const formatMoney = (value, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
};
export const formatCompactMoney = (value) => {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value || 0);
};

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "N/A";

export const compactDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "N/A";

export const humanizeTransferType = (value) =>
  value
    ?.split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown";

export const humanizeLabel = (value) =>
  value
    ?.toString()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Unknown";

export const getInitials = (value, fallback = "CP") =>
  (typeof value === "string" && value.trim() ? value : fallback)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const getEntityId = (entity) => entity?.id || entity?._id || "";

export const asArray = (value) => (Array.isArray(value) ? value : []);

export const sumBalances = (wallet = {}) =>
  Object.values(wallet?.balances || {}).reduce(
    (sum, amount) => sum + Number(amount || 0),
    0
  );

export const normalizeRole = (value) => value?.toString().toUpperCase() || "";

export const getVolumeProfile = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1000000) {
    return {
      key: "1M_PLUS",
      label: "Above 1M",
      priority: "Enterprise",
      rank: 4,
    };
  }

  if (amount >= 100000) {
    return {
      key: "100K_1M",
      label: "100K to 1M",
      priority: "Priority",
      rank: 3,
    };
  }

  if (amount >= 10000) {
    return {
      key: "10K_100K",
      label: "10K to 100K",
      priority: "Growth",
      rank: 2,
    };
  }

  return {
    key: "UNDER_10K",
    label: "Under 10K",
    priority: "Standard",
    rank: 1,
  };
};
